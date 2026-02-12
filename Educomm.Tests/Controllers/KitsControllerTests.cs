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
    }
}
