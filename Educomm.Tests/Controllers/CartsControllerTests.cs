using Educomm.Controllers;
using Educomm.Models;
using Educomm.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Educomm.Tests.Controllers
{
    public class CartsControllerTests
    {
        [Fact]
        public async Task GetMyCart_NoCart_ReturnsNotFound()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new CartsController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.GetMyCart();

            Assert.IsType<NotFoundObjectResult>(result.Result);
        }

        [Fact]
        public async Task AddToCart_CreatesCartAndItem()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(42, "user42@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1));
            await context.SaveChangesAsync();

            var controller = new CartsController(context);
            TestControllerContext.SetUser(controller, userId: 42);

            var result = await controller.AddToCart(new CartRequest
            {
                KitId = 1,
                Quantity = 2
            });

            var cart = Assert.IsType<Cart>(result.Value);
            Assert.Equal(42, cart.UserId);
            Assert.Single(cart.CartItems);
        }

        [Fact]
        public async Task UpdateQuantity_ItemNotFound_ReturnsNotFound()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new CartsController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.UpdateQuantity(new CartRequest
            {
                KitId = 999,
                Quantity = 1
            });

            var notFound = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Item not found in your cart.", notFound.Value);
        }

        [Fact]
        public async Task UpdateQuantity_Zero_RemovesItem()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1));
            context.Carts.Add(TestDataBuilder.CreateCart(1, userId: 1));
            context.CartItems.Add(TestDataBuilder.CreateCartItem(1, cartId: 1, kitId: 1, quantity: 2));
            await context.SaveChangesAsync();

            var controller = new CartsController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.UpdateQuantity(new CartRequest
            {
                KitId = 1,
                Quantity = 0
            });

            Assert.IsType<OkObjectResult>(result);
            Assert.Empty(context.CartItems);
        }

        [Fact]
        public async Task RemoveCartItem_Unauthorized_ReturnsUnauthorized()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1));
            context.Carts.Add(TestDataBuilder.CreateCart(1, userId: 1));
            context.CartItems.Add(TestDataBuilder.CreateCartItem(1, cartId: 1, kitId: 1, quantity: 1));
            await context.SaveChangesAsync();

            var controller = new CartsController(context);
            TestControllerContext.SetUser(controller, userId: 2);

            var result = await controller.RemoveCartItem(1);

            var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal("You cannot delete items from someone else's cart.", unauthorized.Value);
        }

        [Fact]
        public async Task ClearCart_Empty_ReturnsNotFound()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Carts.Add(TestDataBuilder.CreateCart(1, userId: 1));
            await context.SaveChangesAsync();

            var controller = new CartsController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.ClearCart();

            var notFound = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Cart is already empty.", notFound.Value);
        }
    }
}
