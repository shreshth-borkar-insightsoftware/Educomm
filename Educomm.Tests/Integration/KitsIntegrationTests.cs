using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Educomm.Tests.Integration
{
    public class KitsIntegrationTests : IntegrationTestBase
    {
        public KitsIntegrationTests(CustomWebApplicationFactory factory) : base(factory) { }

        [Fact]
        public async Task GetKits_Authenticated_ReturnsPaginatedList()
        {
            var category = await SeedCategoryAsync("Kits-Get-Cat");
            await SeedKitAsync(category.CategoryId, name: "Kit Alpha", price: 50m);
            await SeedKitAsync(category.CategoryId, name: "Kit Beta", price: 150m);

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Kits?page=1&pageSize=10");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            Assert.True(result.GetProperty("totalCount").GetInt32() >= 2);
        }

        [Fact]
        public async Task GetKits_WithPriceFilter_ReturnsFilteredResults()
        {
            var category = await SeedCategoryAsync("Kits-Filter-Cat");
            await SeedKitAsync(category.CategoryId, name: "Cheap Kit", price: 10m);
            await SeedKitAsync(category.CategoryId, name: "Expensive Kit", price: 500m);

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Kits?minPrice=100&maxPrice=600");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var items = result.GetProperty("items");
            // All returned items should have price >= 100
            foreach (var item in items.EnumerateArray())
            {
                Assert.True(item.GetProperty("price").GetDecimal() >= 100m);
            }
        }

        [Fact]
        public async Task GetKit_ExistingId_ReturnsKit()
        {
            var category = await SeedCategoryAsync("Kits-GetById-Cat");
            var kit = await SeedKitAsync(category.CategoryId, name: "Kit GetById");

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync($"/api/Kits/{kit.KitId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            Assert.Equal("Kit GetById", result.GetProperty("name").GetString());
        }

        [Fact]
        public async Task GetKit_NonExistentId_ReturnsNotFound()
        {
            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Kits/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task PostKit_AsAdmin_ReturnsCreated()
        {
            var category = await SeedCategoryAsync("Kits-Post-Cat");
            var (token, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(token);

            var payload = new
            {
                CategoryId = category.CategoryId,
                Name = "Admin Kit",
                Description = "Admin kit desc",
                SKU = "SKU-ADMIN-001",
                Price = 79.99m,
                StockQuantity = 100,
                ImageUrl = "http://test.com/kit.jpg",
                Weight = 2.0m,
                Dimensions = "15x15x10",
                IsActive = true
            };

            var response = await Client.PostAsJsonAsync("/api/Kits", payload);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        [Fact]
        public async Task PostKit_AsCustomer_ReturnsForbidden()
        {
            var category = await SeedCategoryAsync("Kits-PostForbid-Cat");
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);

            var payload = new
            {
                CategoryId = category.CategoryId,
                Name = "Customer Kit",
                Description = "Desc",
                SKU = "SKU-CUST-001",
                Price = 29.99m,
                StockQuantity = 10,
                ImageUrl = "http://test.com/kit.jpg",
                Weight = 1.0m,
                Dimensions = "10x10x5",
                IsActive = true
            };

            var response = await Client.PostAsJsonAsync("/api/Kits", payload);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task PostKit_InvalidCategory_ReturnsBadRequest()
        {
            var (token, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(token);

            var payload = new
            {
                CategoryId = 99999,
                Name = "Bad Cat Kit",
                Description = "Desc",
                SKU = "SKU-BAD-001",
                Price = 49.99m,
                StockQuantity = 10,
                ImageUrl = "http://test.com/kit.jpg",
                Weight = 1.0m,
                Dimensions = "10x10x5",
                IsActive = true
            };

            var response = await Client.PostAsJsonAsync("/api/Kits", payload);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task DeleteKit_AsAdmin_ReturnsOk()
        {
            var category = await SeedCategoryAsync("Kits-Delete-Cat");
            var kit = await SeedKitAsync(category.CategoryId, name: "Kit To Delete");

            var (token, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(token);

            var response = await Client.DeleteAsync($"/api/Kits/{kit.KitId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task DeleteKit_NonExistent_ReturnsNotFound()
        {
            var (token, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(token);

            var response = await Client.DeleteAsync("/api/Kits/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetKits_WithCourseIdFilter_ReturnsOnlyLinkedKits()
        {
            var category = await SeedCategoryAsync("CourseLink-Cat");
            var course1 = await SeedCourseAsync(category.CategoryId, "Course A");
            var course2 = await SeedCourseAsync(category.CategoryId, "Course B");
            await SeedKitAsync(category.CategoryId, course1.CourseId, "Kit for Course A");
            await SeedKitAsync(category.CategoryId, course2.CourseId, "Kit for Course B");

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync($"/api/Kits?courseId={course1.CourseId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var items = result.GetProperty("items");
            Assert.Single(items.EnumerateArray());
        }

        [Fact]
        public async Task GetKits_MinPriceOnly_ReturnsKitsAbovePrice()
        {
            var category = await SeedCategoryAsync("MinPrice-Cat");
            await SeedKitAsync(category.CategoryId, name: "Low", price: 50m);
            await SeedKitAsync(category.CategoryId, name: "High", price: 200m);

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Kits?minPrice=100");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var items = result.GetProperty("items");
            foreach (var item in items.EnumerateArray())
            {
                Assert.True(item.GetProperty("price").GetDecimal() >= 100m);
            }
        }

        [Fact]
        public async Task GetKits_MaxPriceOnly_ReturnsKitsBelowPrice()
        {
            var category = await SeedCategoryAsync("MaxPrice-Cat");
            await SeedKitAsync(category.CategoryId, name: "Low", price: 50m);
            await SeedKitAsync(category.CategoryId, name: "High", price: 200m);

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Kits?maxPrice=100");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var items = result.GetProperty("items");
            foreach (var item in items.EnumerateArray())
            {
                Assert.True(item.GetProperty("price").GetDecimal() <= 100m);
            }
        }

        [Fact]
        public async Task GetKits_InStockFilter_ReturnsOnlyAvailableKits()
        {
            var category = await SeedCategoryAsync("Stock-Cat");
            
            await WithDbContextAsync(async context =>
            {
                context.Kits.Add(new Educomm.Models.Kit
                {
                    Name = "In Stock Kit",
                    Description = "Test kit description",
                    SKU = "TEST-SKU-001",
                    ImageUrl = "http://test.com/img.jpg",
                    CategoryId = category.CategoryId,
                    Price = 100m,
                    StockQuantity = 10,
                    IsActive = true
                });
                context.Kits.Add(new Educomm.Models.Kit
                {
                    Name = "Out of Stock Kit",
                    Description = "Test kit description",
                    SKU = "TEST-SKU-002",
                    ImageUrl = "http://test.com/img.jpg",
                    CategoryId = category.CategoryId,
                    Price = 100m,
                    StockQuantity = 0,
                    IsActive = true
                });
                await context.SaveChangesAsync();
            });

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Kits?inStock=true");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var items = result.GetProperty("items");
            foreach (var item in items.EnumerateArray())
            {
                Assert.True(item.GetProperty("stockQuantity").GetInt32() > 0);
            }
        }

        [Fact]
        public async Task GetKits_IsActiveFilter_ReturnsOnlyActiveKits()
        {
            var category = await SeedCategoryAsync("Active-Cat");
            
            await WithDbContextAsync(async context =>
            {
                context.Kits.Add(new Educomm.Models.Kit
                {
                    Name = "Active Kit",
                    Description = "Test kit description",
                    SKU = "TEST-SKU-003",
                    ImageUrl = "http://test.com/img.jpg",
                    CategoryId = category.CategoryId,
                    Price = 100m,
                    StockQuantity = 5,
                    IsActive = true
                });
                context.Kits.Add(new Educomm.Models.Kit
                {
                    Name = "Inactive Kit",
                    Description = "Test kit description",
                    SKU = "TEST-SKU-004",
                    ImageUrl = "http://test.com/img.jpg",
                    CategoryId = category.CategoryId,
                    Price = 100m,
                    StockQuantity = 5,
                    IsActive = false
                });
                await context.SaveChangesAsync();\n            });

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Kits?isActive=true");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var items = result.GetProperty("items");
            foreach (var item in items.EnumerateArray())
            {
                Assert.True(item.GetProperty("isActive").GetBoolean());
            }
        }

        [Fact]
        public async Task GetKits_SortByPriceLow_ReturnsSortedAscending()
        {
            var category = await SeedCategoryAsync("SortPrice-Cat");
            await SeedKitAsync(category.CategoryId, name: "Expensive", price: 300m);
            await SeedKitAsync(category.CategoryId, name: "Cheap", price: 50m);
            await SeedKitAsync(category.CategoryId, name: "Medium", price: 150m);

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Kits?sortBy=price_low");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var items = result.GetProperty("items").EnumerateArray().ToList();
            
            for (int i = 0; i < items.Count - 1; i++)
            {
                var current = items[i].GetProperty("price").GetDecimal();
                var next = items[i + 1].GetProperty("price").GetDecimal();
                Assert.True(current <= next);
            }
        }

        [Fact]
        public async Task GetKits_SortByPriceHigh_ReturnsSortedDescending()
        {
            var category = await SeedCategoryAsync("SortPriceHigh-Cat");
            await SeedKitAsync(category.CategoryId, name: "Cheap", price: 50m);
            await SeedKitAsync(category.CategoryId, name: "Expensive", price: 300m);
            await SeedKitAsync(category.CategoryId, name: "Medium", price: 150m);

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Kits?sortBy=price_high");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var items = result.GetProperty("items").EnumerateArray().ToList();
            
            for (int i = 0; i < items.Count - 1; i++)
            {
                var current = items[i].GetProperty("price").GetDecimal();
                var next = items[i + 1].GetProperty("price").GetDecimal();
                Assert.True(current >= next);
            }
        }

        [Fact]
        public async Task GetKits_MinPriceGreaterThanMaxPrice_ReturnsBadRequest()
        {
            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Kits?minPrice=500&maxPrice=100");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }
}
