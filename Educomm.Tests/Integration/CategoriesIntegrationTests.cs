using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Educomm.Tests.Integration
{
    public class CategoriesIntegrationTests : IntegrationTestBase
    {
        public CategoriesIntegrationTests(CustomWebApplicationFactory factory) : base(factory) { }

        [Fact]
        public async Task GetCategories_Authenticated_ReturnsPaginatedList()
        {
            await SeedCategoryAsync("Categories-Get-A");
            await SeedCategoryAsync("Categories-Get-B");

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Categories?page=1&pageSize=10");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            Assert.True(result.GetProperty("totalCount").GetInt32() >= 2);
        }

        [Fact]
        public async Task PostCategory_AsAdmin_ReturnsOk()
        {
            var (token, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(token);

            var payload = new
            {
                Name = "Admin Category",
                Description = "Admin created category",
                IsActive = true
            };

            var response = await Client.PostAsJsonAsync("/api/Categories", payload);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            Assert.Equal("Admin Category", result.GetProperty("name").GetString());
        }

        [Fact]
        public async Task PostCategory_AsCustomer_ReturnsForbidden()
        {
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);

            var payload = new
            {
                Name = "Customer Category",
                Description = "Should not work",
                IsActive = true
            };

            var response = await Client.PostAsJsonAsync("/api/Categories", payload);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task DeleteCategory_AsAdmin_ReturnsOk()
        {
            var category = await SeedCategoryAsync("Category To Delete");

            var (token, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(token);

            var response = await Client.DeleteAsync($"/api/Categories/{category.CategoryId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task DeleteCategory_NonExistent_ReturnsNotFound()
        {
            var (token, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(token);

            var response = await Client.DeleteAsync("/api/Categories/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
