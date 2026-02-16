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

        // ──── NEW TESTS: Fill missing branches ────

        [Fact]
        public async Task GetMyCart_ExistingCart_ReturnsCartWithItems()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1));
            context.Carts.Add(TestDataBuilder.CreateCart(1, userId: 1));
            context.CartItems.Add(TestDataBuilder.CreateCartItem(1, cartId: 1, kitId: 1, quantity: 3));
            await context.SaveChangesAsync();

            var controller = new CartsController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.GetMyCart();

            var cart = Assert.IsType<Cart>(result.Value);
            Assert.Equal(1, cart.UserId);
            Assert.Single(cart.CartItems);
            Assert.Equal(3, cart.CartItems.First().Quantity);
        }

        [Fact]
        public async Task AddToCart_ExistingCartNewItem_AddsItem()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.AddRange(
                TestDataBuilder.CreateKit(1, categoryId: 1, name: "Kit A"),
                TestDataBuilder.CreateKit(2, categoryId: 1, name: "Kit B"));
            context.Carts.Add(TestDataBuilder.CreateCart(1, userId: 1));
            context.CartItems.Add(TestDataBuilder.CreateCartItem(1, cartId: 1, kitId: 1, quantity: 1));
            await context.SaveChangesAsync();

            var controller = new CartsController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.AddToCart(new CartRequest { KitId = 2, Quantity = 1 });

            var cart = Assert.IsType<Cart>(result.Value);
            Assert.Equal(2, cart.CartItems.Count);
        }

        [Fact]
        public async Task AddToCart_ExistingItem_IncrementsQuantity()
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

            var result = await controller.AddToCart(new CartRequest { KitId = 1, Quantity = 3 });

            var cart = Assert.IsType<Cart>(result.Value);
            Assert.Single(cart.CartItems);
            Assert.Equal(5, cart.CartItems.First().Quantity);
        }

        [Fact]
        public async Task UpdateQuantity_PositiveQuantity_UpdatesSuccessfully()
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

            var result = await controller.UpdateQuantity(new CartRequest { KitId = 1, Quantity = 5 });

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Quantity updated successfully.", ok.Value);
            var item = context.CartItems.First();
            Assert.Equal(5, item.Quantity);
        }

        [Fact]
        public async Task RemoveCartItem_NotFound_ReturnsNotFound()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new CartsController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.RemoveCartItem(999);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task RemoveCartItem_Success_RemovesItem()
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
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.RemoveCartItem(1);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Item removed.", ok.Value);
            Assert.Empty(context.CartItems);
        }

        [Fact]
        public async Task ClearCart_WithItems_ClearsAll()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.AddRange(
                TestDataBuilder.CreateKit(1, categoryId: 1, name: "Kit A"),
                TestDataBuilder.CreateKit(2, categoryId: 1, name: "Kit B"));
            context.Carts.Add(TestDataBuilder.CreateCart(1, userId: 1));
            context.CartItems.AddRange(
                TestDataBuilder.CreateCartItem(1, cartId: 1, kitId: 1, quantity: 1),
                TestDataBuilder.CreateCartItem(2, cartId: 1, kitId: 2, quantity: 2));
            await context.SaveChangesAsync();

            var controller = new CartsController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.ClearCart();

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Cart emptied.", ok.Value);
            Assert.Empty(context.CartItems);
        }
    }
}
