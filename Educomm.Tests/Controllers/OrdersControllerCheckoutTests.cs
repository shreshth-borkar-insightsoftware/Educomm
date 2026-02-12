using Educomm.Controllers;
using Educomm.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Educomm.Tests.Controllers
{
    public class OrdersControllerCheckoutTests
    {
        [Fact]
        public async Task Checkout_EmptyCart_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;

            var controller = new OrdersController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.Checkout("Address");

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Cart is empty.", badRequest.Value);
        }

        [Fact]
        public async Task Checkout_InsufficientStock_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;

            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1));
            context.Carts.Add(TestDataBuilder.CreateCart(1, userId: 1));
            context.CartItems.Add(TestDataBuilder.CreateCartItem(1, cartId: 1, kitId: 1, quantity: 50));
            await context.SaveChangesAsync();

            var controller = new OrdersController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.Checkout("Address");

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Contains("Not enough stock", badRequest.Value?.ToString());
        }

        [Fact]
        public async Task Checkout_Success_CreatesOrderAndClearsCart()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;

            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1, categoryId: 1));
            var kit = TestDataBuilder.CreateKit(1, categoryId: 1, courseId: 1);
            kit.StockQuantity = 5;
            context.Kits.Add(kit);
            context.Carts.Add(TestDataBuilder.CreateCart(1, userId: 1));
            context.CartItems.Add(TestDataBuilder.CreateCartItem(1, cartId: 1, kitId: 1, quantity: 2));
            await context.SaveChangesAsync();

            var controller = new OrdersController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.Checkout("Address");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var order = Assert.IsType<Educomm.Models.Order>(ok.Value);
            Assert.Equal(1, order.UserId);

            var remainingItems = await context.CartItems.ToListAsync();
            Assert.Empty(remainingItems);

            var updatedKit = await context.Kits.FindAsync(1);
            Assert.Equal(3, updatedKit?.StockQuantity);

            var enrollments = await context.Enrollments.ToListAsync();
            Assert.Single(enrollments);
        }

        [Fact]
        public async Task Checkout_MultipleItems_CreatesTwoOrderItems()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;

            context.Users.Add(TestDataBuilder.CreateUser(2, "user2@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1, categoryId: 1));

            var courseKit = TestDataBuilder.CreateKit(1, categoryId: 1, courseId: 1, name: "Course Kit");
            courseKit.StockQuantity = 10;
            var generalKit = TestDataBuilder.CreateKit(2, categoryId: 1, courseId: null, name: "General Kit");
            generalKit.StockQuantity = 10;

            context.Kits.AddRange(courseKit, generalKit);
            context.Carts.Add(TestDataBuilder.CreateCart(1, userId: 2));
            context.CartItems.AddRange(
                TestDataBuilder.CreateCartItem(1, cartId: 1, kitId: 1, quantity: 1),
                TestDataBuilder.CreateCartItem(2, cartId: 1, kitId: 2, quantity: 1));
            await context.SaveChangesAsync();

            var controller = new OrdersController(context);
            TestControllerContext.SetUser(controller, userId: 2);

            var result = await controller.Checkout("Address");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var order = Assert.IsType<Educomm.Models.Order>(ok.Value);
            Assert.Equal(2, order.OrderItems.Count);

            var enrollments = await context.Enrollments.ToListAsync();
            Assert.Single(enrollments);
        }

        [Fact]
        public async Task Checkout_MultipleItems_InsufficientStock_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;

            context.Users.Add(TestDataBuilder.CreateUser(3, "user3@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));

            var kitOk = TestDataBuilder.CreateKit(1, categoryId: 1, name: "Kit Ok");
            kitOk.StockQuantity = 5;
            var kitLow = TestDataBuilder.CreateKit(2, categoryId: 1, name: "Kit Low");
            kitLow.StockQuantity = 0;

            context.Kits.AddRange(kitOk, kitLow);
            context.Carts.Add(TestDataBuilder.CreateCart(1, userId: 3));
            context.CartItems.AddRange(
                TestDataBuilder.CreateCartItem(1, cartId: 1, kitId: 1, quantity: 1),
                TestDataBuilder.CreateCartItem(2, cartId: 1, kitId: 2, quantity: 1));
            await context.SaveChangesAsync();

            var controller = new OrdersController(context);
            TestControllerContext.SetUser(controller, userId: 3);

            var result = await controller.Checkout("Address");

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Contains("Not enough stock", badRequest.Value?.ToString());

            Assert.Empty(context.Orders);
            Assert.Equal(2, context.CartItems.Count());
        }
    }
}
