using Educomm.Controllers;
using Educomm.Models;
using Educomm.Models.DTOs;
using Educomm.Tests.Helpers;
using Xunit;

namespace Educomm.Tests.Controllers
{
    public class UsersControllerTests
    {
        [Fact]
        public async Task GetUsers_ReturnsPaginatedResponse()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.AddRange(
                TestDataBuilder.CreateUser(1, "u1@example.com"),
                TestDataBuilder.CreateUser(2, "u2@example.com"));
            await context.SaveChangesAsync();

            var controller = new UsersController(context);

            var result = await controller.GetUsers();

            var response = Assert.IsType<PaginatedResponse<User>>(result.Value);
            Assert.Equal(2, response.TotalCount);
            Assert.Equal(2, response.Items.Count());
        }

        [Fact]
        public async Task GetUsers_Empty_ReturnsPaginatedResponse()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new UsersController(context);

            var result = await controller.GetUsers();

            var response = Assert.IsType<PaginatedResponse<User>>(result.Value);
            Assert.Equal(0, response.TotalCount);
            Assert.Empty(response.Items);
        }

        [Fact]
        public async Task GetUsers_PageSizeExceedsMaximum_CapsAtMaxPageSize()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            // Create 150 users to test the limit
            for (var i = 1; i <= 150; i++)
            {
                context.Users.Add(TestDataBuilder.CreateUser(i, $"user{i}@example.com"));
            }
            await context.SaveChangesAsync();

            var controller = new UsersController(context);

            // Request 500 items
            var result = await controller.GetUsers(page: 1, pageSize: 500);

            var response = Assert.IsType<PaginatedResponse<User>>(result.Value);
            // Should only return 100 items (MAX_PAGE_SIZE)
            Assert.Equal(100, response.Items.Count());
            Assert.Equal(100, response.PageSize);
        }

        // ──── NEW TEST ────

        [Fact]
        public async Task GetUsers_Pagination_ReturnsSecondPage()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            for (var i = 1; i <= 12; i++)
            {
                context.Users.Add(TestDataBuilder.CreateUser(i, $"user{i}@example.com"));
            }
            await context.SaveChangesAsync();

            var controller = new UsersController(context);

            var result = await controller.GetUsers(page: 2, pageSize: 5);

            var response = Assert.IsType<PaginatedResponse<User>>(result.Value);
            Assert.Equal(2, response.Page);
            Assert.Equal(5, response.Items.Count());
            Assert.Equal(12, response.TotalCount);
        }
    }
}
