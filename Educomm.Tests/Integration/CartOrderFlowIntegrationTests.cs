using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Educomm.Models;
using Microsoft.EntityFrameworkCore;

namespace Educomm.Tests.Integration
{
    /// <summary>
    /// Integration tests covering the full cart → checkout → order flow,
    /// exercising Cart and Orders controllers end-to-end.
    /// </summary>
    public class CartOrderFlowIntegrationTests : IntegrationTestBase
    {
        public CartOrderFlowIntegrationTests(CustomWebApplicationFactory factory) : base(factory) { }

        [Fact]
        public async Task AddToCart_ReturnsCartWithItem()
        {
            var category = await SeedCategoryAsync("CartFlow-Add-Cat");
            var kit = await SeedKitAsync(category.CategoryId, name: "Cart Kit");

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var payload = new { KitId = kit.KitId, Quantity = 2 };
            var response = await Client.PostAsJsonAsync("/api/Carts/Add", payload);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var items = result.GetProperty("cartItems");
            Assert.True(items.GetArrayLength() >= 1);
        }

        [Fact]
        public async Task GetMyCart_WithItems_ReturnsCart()
        {
            var category = await SeedCategoryAsync("CartFlow-Get-Cat");
            var kit = await SeedKitAsync(category.CategoryId, name: "Cart Get Kit");

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            // Add item to cart first
            await Client.PostAsJsonAsync("/api/Carts/Add", new { KitId = kit.KitId, Quantity = 1 });

            var response = await Client.GetAsync("/api/Carts/MyCart");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetMyCart_NoCart_ReturnsNotFound()
        {
            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Carts/MyCart");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task UpdateQuantity_ValidItem_ReturnsOk()
        {
            var category = await SeedCategoryAsync("CartFlow-Update-Cat");
            var kit = await SeedKitAsync(category.CategoryId, name: "Cart Update Kit");

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            await Client.PostAsJsonAsync("/api/Carts/Add", new { KitId = kit.KitId, Quantity = 1 });

            var updatePayload = new { KitId = kit.KitId, Quantity = 5 };
            var response = await Client.PutAsJsonAsync("/api/Carts/UpdateQuantity", updatePayload);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task UpdateQuantity_NonExistentItem_ReturnsNotFound()
        {
            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.PutAsJsonAsync("/api/Carts/UpdateQuantity", new { KitId = 99999, Quantity = 1 });

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task AddToCart_ExistingItem_IncrementsQuantity()
        {
            var category = await SeedCategoryAsync("Cart-Increment-Cat");
            var kit = await SeedKitAsync(category.CategoryId, name: "Increment Kit");

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            // Add first time
            await Client.PostAsJsonAsync("/api/Carts/Add", new { KitId = kit.KitId, Quantity = 2 });
            
            // Add again
            var response = await Client.PostAsJsonAsync("/api/Carts/Add", new { KitId = kit.KitId, Quantity = 3 });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var cartItems = result.GetProperty("cartItems");
            var item = cartItems.EnumerateArray().First();
            Assert.Equal(5, item.GetProperty("quantity").GetInt32()); // 2 + 3 = 5
        }

        [Fact]
        public async Task UpdateQuantity_ToZero_RemovesItem()
        {
            var category = await SeedCategoryAsync("Cart-Zero-Cat");
            var kit = await SeedKitAsync(category.CategoryId, name: "Zero Kit");

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            // Add item
            await Client.PostAsJsonAsync("/api/Carts/Add", new { KitId = kit.KitId, Quantity = 2 });
            
            // Update to zero
            var response = await Client.PutAsJsonAsync("/api/Carts/UpdateQuantity", new { KitId = kit.KitId, Quantity = 0 });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            // Verify cart is now empty
            var getResponse = await Client.GetAsync("/api/Carts/MyCart");
            var json = await getResponse.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var cartItems = result.GetProperty("cartItems");
            Assert.Empty(cartItems.EnumerateArray());
        }

        [Fact]
        public async Task RemoveCartItem_NonExistentItem_ReturnsNotFound()
        {
            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.DeleteAsync("/api/Carts/RemoveItem/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task ClearCart_WithItems_ReturnsOk()
        {
            var category = await SeedCategoryAsync("CartFlow-Clear-Cat");
            var kit = await SeedKitAsync(category.CategoryId, name: "Cart Clear Kit");

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            await Client.PostAsJsonAsync("/api/Carts/Add", new { KitId = kit.KitId, Quantity = 2 });

            var response = await Client.DeleteAsync("/api/Carts/Clear");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task ClearCart_Empty_ReturnsNotFound()
        {
            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.DeleteAsync("/api/Carts/Clear");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task Checkout_FullFlow_CreatesOrder()
        {
            var category = await SeedCategoryAsync("CartFlow-Checkout-Cat");
            var kit = await SeedKitAsync(category.CategoryId, name: "Checkout Kit", price: 50m, stock: 100);

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            // Add to cart
            await Client.PostAsJsonAsync("/api/Carts/Add", new { KitId = kit.KitId, Quantity = 2 });

            // Checkout
            var shippingAddress = "\"123 Test Street, Apt 4, Test City, TS 12345\"";
            var content = new StringContent(shippingAddress, Encoding.UTF8, "application/json");
            var response = await Client.PostAsync("/api/Orders/Checkout", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            Assert.Equal("Pending", result.GetProperty("status").GetString());
            Assert.Equal(100m, result.GetProperty("totalAmount").GetDecimal()); // 50 * 2
        }

        [Fact]
        public async Task Checkout_EmptyCart_ReturnsBadRequest()
        {
            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var shippingAddress = "\"123 Test Street, Apt 4, Test City, TS 12345\"";
            var content = new StringContent(shippingAddress, Encoding.UTF8, "application/json");
            var response = await Client.PostAsync("/api/Orders/Checkout", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Checkout_EmptyAddress_ReturnsBadRequest()
        {
            var category = await SeedCategoryAsync("CartFlow-EmptyAddr-Cat");
            var kit = await SeedKitAsync(category.CategoryId, name: "EmptyAddr Kit", stock: 50);

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            await Client.PostAsJsonAsync("/api/Carts/Add", new { KitId = kit.KitId, Quantity = 1 });

            var emptyAddress = "\"\"";
            var content = new StringContent(emptyAddress, Encoding.UTF8, "application/json");
            var response = await Client.PostAsync("/api/Orders/Checkout", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Checkout_ShortAddress_ReturnsBadRequest()
        {
            var category = await SeedCategoryAsync("CartFlow-ShortAddr-Cat");
            var kit = await SeedKitAsync(category.CategoryId, name: "ShortAddr Kit", stock: 50);

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            await Client.PostAsJsonAsync("/api/Carts/Add", new { KitId = kit.KitId, Quantity = 1 });

            var shortAddress = "\"123 AB\""; // Less than MIN_ADDRESS_LENGTH (10)
            var content = new StringContent(shortAddress, Encoding.UTF8, "application/json");
            var response = await Client.PostAsync("/api/Orders/Checkout", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task GetMyOrders_AfterCheckout_ReturnsOrders()
        {
            var category = await SeedCategoryAsync("CartFlow-MyOrders-Cat");
            var kit = await SeedKitAsync(category.CategoryId, name: "MyOrders Kit", price: 25m, stock: 100);

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            // Add, checkout
            await Client.PostAsJsonAsync("/api/Carts/Add", new { KitId = kit.KitId, Quantity = 1 });
            var shippingAddress = "\"123 Test Street, Suite 5, City, ST 12345\"";
            var content = new StringContent(shippingAddress, Encoding.UTF8, "application/json");
            await Client.PostAsync("/api/Orders/Checkout", content);

            // Get my orders
            var response = await Client.GetAsync("/api/Orders/MyOrders");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            Assert.True(result.GetProperty("totalCount").GetInt32() >= 1);
        }

        [Fact]
        public async Task AdminGetAllOrders_ReturnsOrders()
        {
            var (adminToken, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(adminToken);

            var response = await Client.GetAsync("/api/Orders/Admin/AllOrders");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            Assert.True(result.TryGetProperty("totalCount", out _));
        }

        [Fact]
        public async Task AdminGetAllOrders_AsCustomer_ReturnsForbidden()
        {
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Orders/Admin/AllOrders");

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task AdminUpdateOrderStatus_ReturnsOk()
        {
            // Create a customer who places an order
            var category = await SeedCategoryAsync("CartFlow-Status-Cat");
            var kit = await SeedKitAsync(category.CategoryId, name: "Status Kit", price: 30m, stock: 100);

            var (custToken, _) = await CreateAuthenticatedUserAsync("Customer", "statususer");
            SetAuthToken(custToken);
            await Client.PostAsJsonAsync("/api/Carts/Add", new { KitId = kit.KitId, Quantity = 1 });
            var addr = "\"123 Status Ave, Test City, ST 12345\"";
            var addrContent = new StringContent(addr, Encoding.UTF8, "application/json");
            var checkoutResp = await Client.PostAsync("/api/Orders/Checkout", addrContent);
            var orderJson = await checkoutResp.Content.ReadAsStringAsync();
            var orderResult = JsonSerializer.Deserialize<JsonElement>(orderJson, JsonOptions);
            var orderId = orderResult.GetProperty("orderId").GetInt32();

            // Now admin updates the status
            var (adminToken, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(adminToken);

            var statusContent = new StringContent("\"Shipped\"", Encoding.UTF8, "application/json");
            var response = await Client.PutAsync($"/api/Orders/Admin/UpdateStatus/{orderId}", statusContent);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Checkout_WithCourseLinkedKit_CreatesEnrollment()
        {
            var category = await SeedCategoryAsync("CartFlow-Enroll-Cat");
            var course = await SeedCourseAsync(category.CategoryId, "Enrollment Course via Checkout");
            var kit = await SeedKitAsync(category.CategoryId, courseId: course.CourseId,
                name: "Course Kit", price: 40m, stock: 100);

            var (token, userId) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            await Client.PostAsJsonAsync("/api/Carts/Add", new { KitId = kit.KitId, Quantity = 1 });
            var addr = "\"123 Enroll Street, City, State 12345\"";
            var content = new StringContent(addr, Encoding.UTF8, "application/json");
            await Client.PostAsync("/api/Orders/Checkout", content);

            // Verify enrollment was created
            bool enrolled = false;
            await WithDbContextAsync(async db =>
            {
                enrolled = await db.Enrollments.AnyAsync(e => e.UserId == userId && e.CourseId == course.CourseId);
            });

            Assert.True(enrolled);
        }

        [Fact]
        public async Task Checkout_InsufficientStock_ReturnsBadRequest()
        {
            var category = await SeedCategoryAsync("Stock-Fail-Cat");
            var kit = await SeedKitAsync(category.CategoryId, name: "Low Stock Kit", price: 50m, stock: 2);

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            await Client.PostAsJsonAsync("/api/Carts/Add", new { KitId = kit.KitId, Quantity = 5 });
            var addr = "\"123 Stock Street, City, ST 12345\"";
            var content = new StringContent(addr, Encoding.UTF8, "application/json");
            
            var response = await Client.PostAsync("/api/Orders/Checkout", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseText = await response.Content.ReadAsStringAsync();
            Assert.Contains("stock", responseText.ToLower());
        }

        [Fact]
        public async Task AdminUpdateOrderStatus_NonExistentOrder_ReturnsNotFound()
        {
            var (token, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(token);

            var statusContent = new StringContent("\"Delivered\"", Encoding.UTF8, "application/json");
            var response = await Client.PutAsync("/api/Orders/Admin/UpdateStatus/99999", statusContent);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
