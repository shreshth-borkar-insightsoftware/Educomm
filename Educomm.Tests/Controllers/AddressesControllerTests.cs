using Educomm.Controllers;
using Educomm.Models;
using Educomm.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Educomm.Tests.Controllers
{
    public class AddressesControllerTests
    {
        [Fact]
        public async Task GetMyAddresses_ReturnsOnlyUserAddresses()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.AddRange(
                TestDataBuilder.CreateUser(1, "user1@example.com"),
                TestDataBuilder.CreateUser(2, "user2@example.com"));
            context.Addresses.AddRange(
                TestDataBuilder.CreateAddress(1, userId: 1),
                TestDataBuilder.CreateAddress(2, userId: 2));
            await context.SaveChangesAsync();

            var controller = new AddressesController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.GetMyAddresses();

            var addresses = Assert.IsType<List<Address>>(result.Value);
            Assert.Single(addresses);
            Assert.Equal(1, addresses[0].UserId);
        }

        [Fact]
        public async Task PostAddress_SetsUserId()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(5, "user5@example.com"));
            await context.SaveChangesAsync();
            var controller = new AddressesController(context);
            TestControllerContext.SetUser(controller, userId: 5);

            var address = TestDataBuilder.CreateAddress(1, userId: 999, title: "Office");
            var result = await controller.PostAddress(address);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var saved = Assert.IsType<Address>(ok.Value);
            Assert.Equal(5, saved.UserId);
        }

        [Fact]
        public async Task GetMyAddresses_Empty_ReturnsEmptyList()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new AddressesController(context);
            TestControllerContext.SetUser(controller, userId: 10);

            var result = await controller.GetMyAddresses();

            var addresses = Assert.IsType<List<Address>>(result.Value);
            Assert.Empty(addresses);
        }
    }
}
