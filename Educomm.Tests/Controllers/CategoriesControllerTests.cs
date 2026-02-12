using Educomm.Controllers;
using Educomm.Models;
using Educomm.Models.DTOs;
using Educomm.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Educomm.Tests.Controllers
{
    public class CategoriesControllerTests
    {
        [Fact]
        public async Task GetCategories_ReturnsPaginatedResponse()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.AddRange(
                TestDataBuilder.CreateCategory(1, "Cat A"),
                TestDataBuilder.CreateCategory(2, "Cat B"));
            await context.SaveChangesAsync();

            var controller = new CategoriesController(context);

            var result = await controller.GetCategories();

            var response = Assert.IsType<PaginatedResponse<Category>>(result.Value);
            Assert.Equal(2, response.TotalCount);
            Assert.Equal(2, response.Items.Count());
        }

        [Fact]
        public async Task DeleteCategory_NotFound_ReturnsNotFound()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new CategoriesController(context);

            var result = await controller.DeleteCategory(999);

            var notFound = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Category not found.", notFound.Value);
        }

        [Fact]
        public async Task DeleteCategory_Existing_ReturnsOk()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            await context.SaveChangesAsync();

            var controller = new CategoriesController(context);

            var result = await controller.DeleteCategory(1);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Category deleted successfully.", ok.Value);
        }
    }
}
