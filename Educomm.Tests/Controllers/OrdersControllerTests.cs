using Educomm.Controllers;
using Educomm.Models.DTOs;
using Educomm.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Educomm.Tests.Controllers
{
    public class OrdersControllerTests
    {
        [Fact]
        public async Task GetMyOrders_ReturnsPaginatedResponse()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(5, "user5@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1));
            var order = TestDataBuilder.CreateOrder(1, userId: 5);
            order.OrderItems.Add(TestDataBuilder.CreateOrderItem(1, orderId: 1, kitId: 1));
            context.Orders.Add(order);
            await context.SaveChangesAsync();

            var controller = new OrdersController(context);
            TestControllerContext.SetUser(controller, userId: 5);

            var result = await controller.GetMyOrders();

            var response = Assert.IsType<PaginatedResponse<Educomm.Models.Order>>(result.Value);
            Assert.Equal(1, response.TotalCount);
            Assert.Single(response.Items);
        }

        [Fact]
        public async Task GetMyOrders_Empty_ReturnsPaginatedResponse()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new OrdersController(context);
            TestControllerContext.SetUser(controller, userId: 10);

            var result = await controller.GetMyOrders();

            var response = Assert.IsType<PaginatedResponse<Educomm.Models.Order>>(result.Value);
            Assert.Equal(0, response.TotalCount);
            Assert.Empty(response.Items);
        }

        [Fact]
        public async Task GetAllOrders_ReturnsPaginatedResponse()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1));
            var order = TestDataBuilder.CreateOrder(1, userId: 1);
            order.OrderItems.Add(TestDataBuilder.CreateOrderItem(1, orderId: 1, kitId: 1));
            context.Orders.Add(order);
            await context.SaveChangesAsync();

            var controller = new OrdersController(context);

            var result = await controller.GetAllOrders();

            var response = Assert.IsType<PaginatedResponse<Educomm.Models.Order>>(result.Value);
            Assert.Equal(1, response.TotalCount);
            Assert.Single(response.Items);
        }

        [Fact]
        public async Task UpdateOrderStatus_NotFound_ReturnsNotFound()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new OrdersController(context);

            var result = await controller.UpdateOrderStatus(123, "Shipped");

            var notFound = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Order not found.", notFound.Value);
        }

        [Fact]
        public async Task UpdateOrderStatus_Existing_ReturnsOk()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Orders.Add(TestDataBuilder.CreateOrder(1, userId: 1));
            await context.SaveChangesAsync();

            var controller = new OrdersController(context);

            var result = await controller.UpdateOrderStatus(1, "Shipped");

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Contains("Order #1 status updated to Shipped", ok.Value?.ToString());
        }

        [Fact]
        public async Task GetMyOrders_PageSizeExceedsMaximum_CapsAtMaxPageSize()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1));
            // Create 150 orders to test the limit
            for (var i = 1; i <= 150; i++)
            {
                var order = TestDataBuilder.CreateOrder(i, userId: 1);
                order.OrderItems.Add(TestDataBuilder.CreateOrderItem(i, orderId: i, kitId: 1));
                context.Orders.Add(order);
            }
            await context.SaveChangesAsync();

            var controller = new OrdersController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            // Request 200 items
            var result = await controller.GetMyOrders(page: 1, pageSize: 200);

            var response = Assert.IsType<PaginatedResponse<Educomm.Models.Order>>(result.Value);
            // Should only return 100 items (MAX_PAGE_SIZE)
            Assert.Equal(100, response.Items.Count());
            Assert.Equal(100, response.PageSize);
        }

        [Fact]
        public async Task GetAllOrders_PageSizeExceedsMaximum_CapsAtMaxPageSize()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1));
            // Create 150 orders to test the limit
            for (var i = 1; i <= 150; i++)
            {
                var order = TestDataBuilder.CreateOrder(i, userId: 1);
                order.OrderItems.Add(TestDataBuilder.CreateOrderItem(i, orderId: i, kitId: 1));
                context.Orders.Add(order);
            }
            await context.SaveChangesAsync();

            var controller = new OrdersController(context);

            // Request 1000 items
            var result = await controller.GetAllOrders(page: 1, pageSize: 1000);

            var response = Assert.IsType<PaginatedResponse<Educomm.Models.Order>>(result.Value);
            // Should only return 100 items (MAX_PAGE_SIZE)
            Assert.Equal(100, response.Items.Count());
            Assert.Equal(100, response.PageSize);
        }
    }
}
