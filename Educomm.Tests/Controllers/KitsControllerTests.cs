using Educomm.Controllers;
using Educomm.Models;
using Educomm.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Educomm.Tests.Controllers
{
    public class KitsControllerTests
    {
        [Fact]
        public async Task GetKits_InvalidPriceRange_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new KitsController(context);

            var result = await controller.GetKits(minPrice: 10, maxPrice: 5);

            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetKit_NotFound_ReturnsNotFound()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new KitsController(context);

            var result = await controller.GetKit(1234);

            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal("Kit not found.", notFound.Value);
        }

        [Fact]
        public async Task PostKit_InvalidCategory_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new KitsController(context);

            var kit = TestDataBuilder.CreateKit(1, categoryId: 99);
            var result = await controller.PostKit(kit);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Invalid CategoryId.", badRequest.Value);
        }

        [Fact]
        public async Task PostKit_InvalidCourse_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var kit = TestDataBuilder.CreateKit(1, categoryId: 1, courseId: 99);
            var result = await controller.PostKit(kit);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Invalid CourseId.", badRequest.Value);
        }

        [Fact]
        public async Task UpdateKit_IdMismatch_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new KitsController(context);

            var kit = TestDataBuilder.CreateKit(1, categoryId: 1);
            var result = await controller.UpdateKit(2, kit);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("ID mismatch.", badRequest.Value);
        }

        [Fact]
        public async Task DeleteKit_NotFound_ReturnsNotFound()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new KitsController(context);

            var result = await controller.DeleteKit(999);

            var notFound = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Kit not found.", notFound.Value);
        }

        [Fact]
        public async Task GetKits_FilterInStock_ReturnsOnlyInStock()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            var inStockKit = TestDataBuilder.CreateKit(1, categoryId: 1, name: "InStock");
            inStockKit.StockQuantity = 5;
            var outOfStockKit = TestDataBuilder.CreateKit(2, categoryId: 1, name: "OutOfStock");
            outOfStockKit.StockQuantity = 0;
            context.Kits.AddRange(inStockKit, outOfStockKit);
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var result = await controller.GetKits(inStock: true);

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Kit>>(result.Value);
            Assert.Single(response.Items);
            Assert.Equal("InStock", response.Items.First().Name);
        }

        [Fact]
        public async Task GetKits_FilterByCourse_ReturnsOnlyCourseKits()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1, categoryId: 1));
            var courseKit = TestDataBuilder.CreateKit(1, categoryId: 1, courseId: 1, name: "CourseKit");
            var generalKit = TestDataBuilder.CreateKit(2, categoryId: 1, courseId: null, name: "GeneralKit");
            context.Kits.AddRange(courseKit, generalKit);
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var result = await controller.GetKits(courseId: 1);

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Kit>>(result.Value);
            Assert.Single(response.Items);
            Assert.Equal("CourseKit", response.Items.First().Name);
        }

        [Fact]
        public async Task GetKits_SortByPriceHigh_ReturnsDescending()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            var cheap = TestDataBuilder.CreateKit(1, categoryId: 1, name: "Cheap");
            cheap.Price = 5;
            var expensive = TestDataBuilder.CreateKit(2, categoryId: 1, name: "Expensive");
            expensive.Price = 50;
            context.Kits.AddRange(cheap, expensive);
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var result = await controller.GetKits(sortBy: "price_high");

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Kit>>(result.Value);
            Assert.Equal("Expensive", response.Items.First().Name);
        }

        [Fact]
        public async Task GetKits_Pagination_ReturnsSecondPage()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            for (var i = 1; i <= 12; i++)
            {
                context.Kits.Add(TestDataBuilder.CreateKit(i, categoryId: 1, name: $"Kit {i:00}"));
            }
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var result = await controller.GetKits(page: 2, pageSize: 5);

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Kit>>(result.Value);
            Assert.Equal(2, response.Page);
            Assert.Equal(5, response.Items.Count());
        }

        [Fact]
        public async Task GetKits_PageSizeExceedsMaximum_CapsAtMaxPageSize()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            // Create 150 kits to test the limit
            for (var i = 1; i <= 150; i++)
            {
                context.Kits.Add(TestDataBuilder.CreateKit(i, categoryId: 1, name: $"Kit {i:00}"));
            }
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            // Request 999 items
            var result = await controller.GetKits(page: 1, pageSize: 999);

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Kit>>(result.Value);
            // Should only return 100 items (MAX_PAGE_SIZE)
            Assert.Equal(100, response.Items.Count());
            Assert.Equal(100, response.PageSize);
        }

        // ──── NEW TESTS: Fill missing branches ────

        [Fact]
        public async Task GetKits_FilterByMinPrice_ReturnsAboveMin()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            var cheap = TestDataBuilder.CreateKit(1, categoryId: 1, name: "Cheap");
            cheap.Price = 5;
            var pricey = TestDataBuilder.CreateKit(2, categoryId: 1, name: "Pricey");
            pricey.Price = 50;
            context.Kits.AddRange(cheap, pricey);
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var result = await controller.GetKits(minPrice: 20);

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Kit>>(result.Value);
            Assert.Single(response.Items);
            Assert.Equal("Pricey", response.Items.First().Name);
        }

        [Fact]
        public async Task GetKits_FilterByMaxPrice_ReturnsBelowMax()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            var cheap = TestDataBuilder.CreateKit(1, categoryId: 1, name: "Cheap");
            cheap.Price = 5;
            var pricey = TestDataBuilder.CreateKit(2, categoryId: 1, name: "Pricey");
            pricey.Price = 50;
            context.Kits.AddRange(cheap, pricey);
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var result = await controller.GetKits(maxPrice: 20);

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Kit>>(result.Value);
            Assert.Single(response.Items);
            Assert.Equal("Cheap", response.Items.First().Name);
        }

        [Fact]
        public async Task GetKits_FilterByIsActive_ReturnsOnlyActive()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            var active = TestDataBuilder.CreateKit(1, categoryId: 1, name: "Active");
            active.IsActive = true;
            var inactive = TestDataBuilder.CreateKit(2, categoryId: 1, name: "Inactive");
            inactive.IsActive = false;
            context.Kits.AddRange(active, inactive);
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var result = await controller.GetKits(isActive: true);

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Kit>>(result.Value);
            Assert.Single(response.Items);
            Assert.True(response.Items.First().IsActive);
        }

        [Fact]
        public async Task GetKits_SortByPriceLow_ReturnsAscending()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            var cheap = TestDataBuilder.CreateKit(1, categoryId: 1, name: "Cheap");
            cheap.Price = 5;
            var expensive = TestDataBuilder.CreateKit(2, categoryId: 1, name: "Expensive");
            expensive.Price = 50;
            context.Kits.AddRange(cheap, expensive);
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var result = await controller.GetKits(sortBy: "price_low");

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Kit>>(result.Value);
            Assert.Equal("Cheap", response.Items.First().Name);
        }

        [Fact]
        public async Task GetKits_SortByNewest_ReturnsDescendingById()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.AddRange(
                TestDataBuilder.CreateKit(1, categoryId: 1, name: "Old Kit"),
                TestDataBuilder.CreateKit(2, categoryId: 1, name: "New Kit"));
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var result = await controller.GetKits(sortBy: "newest");

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Kit>>(result.Value);
            Assert.Equal("New Kit", response.Items.First().Name);
        }

        [Fact]
        public async Task GetKits_InvalidSortBy_FallsBackToName()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.AddRange(
                TestDataBuilder.CreateKit(1, categoryId: 1, name: "B Kit"),
                TestDataBuilder.CreateKit(2, categoryId: 1, name: "A Kit"));
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var result = await controller.GetKits(sortBy: "invalid");

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Kit>>(result.Value);
            Assert.Equal("A Kit", response.Items.First().Name);
        }

        [Fact]
        public async Task GetKits_SortByNameDesc_ReturnsDescending()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.AddRange(
                TestDataBuilder.CreateKit(1, categoryId: 1, name: "Alpha"),
                TestDataBuilder.CreateKit(2, categoryId: 1, name: "Zeta"));
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var result = await controller.GetKits(sortBy: "name", sortOrder: "desc");

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Kit>>(result.Value);
            Assert.Equal("Zeta", response.Items.First().Name);
        }

        [Fact]
        public async Task GetKits_NoFilters_ReturnsAll()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.AddRange(
                TestDataBuilder.CreateKit(1, categoryId: 1, name: "Kit A"),
                TestDataBuilder.CreateKit(2, categoryId: 1, name: "Kit B"),
                TestDataBuilder.CreateKit(3, categoryId: 1, name: "Kit C"));
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var result = await controller.GetKits();

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Kit>>(result.Value);
            Assert.Equal(3, response.TotalCount);
        }

        [Fact]
        public async Task GetKit_Found_ReturnsKit()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1, name: "Test Kit"));
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var result = await controller.GetKit(1);

            var kit = Assert.IsType<Kit>(result.Value);
            Assert.Equal("Test Kit", kit.Name);
        }

        [Fact]
        public async Task PostKit_CourseIdNull_SkipsCheckAndCreates()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var kit = TestDataBuilder.CreateKit(1, categoryId: 1, courseId: null);
            var result = await controller.PostKit(kit);

            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var createdKit = Assert.IsType<Kit>(created.Value);
            Assert.Null(createdKit.CourseId);
        }

        [Fact]
        public async Task PostKit_ValidWithCourse_ReturnsCreated()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1, categoryId: 1));
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var kit = TestDataBuilder.CreateKit(1, categoryId: 1, courseId: 1);
            var result = await controller.PostKit(kit);

            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var createdKit = Assert.IsType<Kit>(created.Value);
            Assert.Equal(1, createdKit.CourseId);
        }

        [Fact]
        public async Task UpdateKit_NotFound_ReturnsNotFound()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;

            var controller = new KitsController(context);

            var kit = TestDataBuilder.CreateKit(999, categoryId: 1);
            var result = await controller.UpdateKit(999, kit);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task UpdateKit_Success_ReturnsOk()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1, name: "Original"));
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            context.ChangeTracker.Clear();

            var updated = TestDataBuilder.CreateKit(1, categoryId: 1, name: "Updated");
            var result = await controller.UpdateKit(1, updated);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Kit updated successfully.", ok.Value);
        }

        [Fact]
        public async Task DeleteKit_Success_DeletesKit()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1));
            await context.SaveChangesAsync();

            var controller = new KitsController(context);

            var result = await controller.DeleteKit(1);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Kit deleted.", ok.Value);
            Assert.Empty(context.Kits);
        }
    }
}
