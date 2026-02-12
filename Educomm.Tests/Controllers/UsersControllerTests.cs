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
    }
}
