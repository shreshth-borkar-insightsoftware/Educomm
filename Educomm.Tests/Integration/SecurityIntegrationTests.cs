using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace Educomm.Tests.Integration
{
    /// <summary>
    /// Integration tests verifying security constraints:
    /// authentication requirements, role enforcement, and cross-user protections.
    /// </summary>
    public class SecurityIntegrationTests : IntegrationTestBase
    {
        public SecurityIntegrationTests(CustomWebApplicationFactory factory) : base(factory) { }

        [Theory]
        [InlineData("/api/Courses")]
        [InlineData("/api/Kits")]
        [InlineData("/api/Categories")]
        [InlineData("/api/Carts/MyCart")]
        [InlineData("/api/Orders/MyOrders")]
        [InlineData("/api/Enrollments/MyEnrollments")]
        public async Task ProtectedEndpoints_NoToken_Returns401(string endpoint)
        {
            ClearAuthToken();
            var response = await Client.GetAsync(endpoint);
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Theory]
        [InlineData("/api/Orders/Admin/AllOrders")]
        [InlineData("/api/Enrollments/Admin/AllEnrollments")]
        public async Task AdminEndpoints_AsCustomer_Returns403(string endpoint)
        {
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);

            var response = await Client.GetAsync(endpoint);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task AdminPostEndpoints_AsCustomer_Returns403()
        {
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);

            // Try to create a category as Customer
            var response = await Client.PostAsJsonAsync("/api/Categories", new
            {
                Name = "Sneaky Category",
                Description = "Should fail",
                IsActive = true
            });

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task MalformedJwt_Returns401()
        {
            Client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", "this.is.not.a.valid.jwt.token");

            var response = await Client.GetAsync("/api/Courses");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task ExpiredOrTamperedToken_Returns401()
        {
            // A structurally valid but incorrectly signed JWT
            var fakeJwt = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9." +
                          "eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoidGVzdEB0ZXN0LmNvbSIsImV4cCI6MTYwMDAwMDAwMH0." +
                          "invalidsignaturehere";

            Client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", fakeJwt);

            var response = await Client.GetAsync("/api/Courses");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task RemoveCartItem_OtherUsersItem_ReturnsUnauthorized()
        {
            var category = await SeedCategoryAsync("Sec-CrossUser-Cat");
            var kit = await SeedKitAsync(category.CategoryId, name: "Cross User Kit");

            // User1 adds an item to cart
            var (token1, _) = await CreateAuthenticatedUserAsync("Customer", "secuser1");
            SetAuthToken(token1);
            var addResp = await Client.PostAsJsonAsync("/api/Carts/Add", new { KitId = kit.KitId, Quantity = 1 });
            var addJson = await addResp.Content.ReadAsStringAsync();
            var addResult = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(addJson, JsonOptions);

            // Get the cartItemId from User1's cart
            var cartItems = addResult.GetProperty("cartItems");
            var cartItemId = cartItems[0].GetProperty("cartItemId").GetInt32();

            // User2 tries to delete User1's cart item
            var (token2, _) = await CreateAuthenticatedUserAsync("Customer", "secuser2");
            SetAuthToken(token2);

            var response = await Client.DeleteAsync($"/api/Carts/RemoveItem/{cartItemId}");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}
