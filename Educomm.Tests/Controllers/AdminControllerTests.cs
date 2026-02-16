using Educomm.Controllers;
using Educomm.Models;
using Educomm.Services;
using Educomm.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Stripe.Checkout;
using Xunit;

namespace Educomm.Tests.Controllers
{
    public class AdminControllerTests
    {
        // ──── SyncHistoricalPayments ────

        [Fact]
        public async Task SyncHistoricalPayments_NullSessionIds_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var stripeService = new Mock<IStripeService>();
            var controller = new AdminController(db.Context, stripeService.Object);

            var result = await controller.SyncHistoricalPayments(null!);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Please provide a list of Stripe session IDs to sync.", badRequest.Value);
        }

        [Fact]
        public async Task SyncHistoricalPayments_EmptyList_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var stripeService = new Mock<IStripeService>();
            var controller = new AdminController(db.Context, stripeService.Object);

            var result = await controller.SyncHistoricalPayments(new List<string>());

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Please provide a list of Stripe session IDs to sync.", badRequest.Value);
        }

        [Fact]
        public async Task SyncHistoricalPayments_SessionNotFound_ReturnsError()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.GetSessionAsync("sess_missing"))
                .ReturnsAsync((Session?)null);

            var controller = new AdminController(db.Context, stripeService.Object);

            var result = await controller.SyncHistoricalPayments(new List<string> { "sess_missing" });

            var ok = Assert.IsType<OkObjectResult>(result);
            var errorCount = (int?)ok.Value?.GetType().GetProperty("errorCount")?.GetValue(ok.Value);
            Assert.Equal(1, errorCount);
        }

        [Fact]
        public async Task SyncHistoricalPayments_PaymentNotPaid_ReturnsSkipped()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.GetSessionAsync("sess_unpaid"))
                .ReturnsAsync(new Session
                {
                    PaymentStatus = "unpaid",
                    Metadata = new Dictionary<string, string>()
                });

            var controller = new AdminController(db.Context, stripeService.Object);

            var result = await controller.SyncHistoricalPayments(new List<string> { "sess_unpaid" });

            var ok = Assert.IsType<OkObjectResult>(result);
            var successCount = (int?)ok.Value?.GetType().GetProperty("successCount")?.GetValue(ok.Value);
            Assert.Equal(0, successCount);
        }

        [Fact]
        public async Task SyncHistoricalPayments_MissingUserId_ReturnsError()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.GetSessionAsync("sess_no_user"))
                .ReturnsAsync(new Session
                {
                    PaymentStatus = "paid",
                    Metadata = new Dictionary<string, string>()
                });

            var controller = new AdminController(db.Context, stripeService.Object);

            var result = await controller.SyncHistoricalPayments(new List<string> { "sess_no_user" });

            var ok = Assert.IsType<OkObjectResult>(result);
            var errorCount = (int?)ok.Value?.GetType().GetProperty("errorCount")?.GetValue(ok.Value);
            Assert.Equal(1, errorCount);
        }

        [Fact]
        public async Task SyncHistoricalPayments_ExistingOrder_ReturnsSkipped()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Orders.Add(new Order
            {
                UserId = 1,
                TotalAmount = 50.00m,
                Status = "Confirmed",
                ShippingAddress = "Test",
                OrderDate = DateTime.UtcNow
            });
            await context.SaveChangesAsync();

            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.GetSessionAsync("sess_dup"))
                .ReturnsAsync(new Session
                {
                    PaymentStatus = "paid",
                    AmountTotal = 5000, // 50.00 * 100
                    Metadata = new Dictionary<string, string> { ["userId"] = "1" }
                });

            var controller = new AdminController(context, stripeService.Object);

            var result = await controller.SyncHistoricalPayments(new List<string> { "sess_dup" });

            var ok = Assert.IsType<OkObjectResult>(result);
            var successCount = (int?)ok.Value?.GetType().GetProperty("successCount")?.GetValue(ok.Value);
            Assert.Equal(0, successCount);
        }

        [Fact]
        public async Task SyncHistoricalPayments_Success_CreatesOrder()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(5, "user5@example.com"));
            await context.SaveChangesAsync();

            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.GetSessionAsync("sess_ok"))
                .ReturnsAsync(new Session
                {
                    PaymentStatus = "paid",
                    AmountTotal = 2500,
                    Created = DateTime.UtcNow,
                    Metadata = new Dictionary<string, string>
                    {
                        ["userId"] = "5",
                        ["shippingAddress"] = "123 Main St"
                    }
                });

            var controller = new AdminController(context, stripeService.Object);

            var result = await controller.SyncHistoricalPayments(new List<string> { "sess_ok" });

            var ok = Assert.IsType<OkObjectResult>(result);
            var successCount = (int?)ok.Value?.GetType().GetProperty("successCount")?.GetValue(ok.Value);
            Assert.Equal(1, successCount);
            Assert.Single(context.Orders);
            var order = context.Orders.First();
            Assert.Equal(5, order.UserId);
            Assert.Equal(25.00m, order.TotalAmount);
            Assert.Equal("123 Main St", order.ShippingAddress);
        }

        [Fact]
        public async Task SyncHistoricalPayments_NoShippingAddress_UsesDefault()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(6, "user6@example.com"));
            await context.SaveChangesAsync();

            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.GetSessionAsync("sess_noaddr"))
                .ReturnsAsync(new Session
                {
                    PaymentStatus = "paid",
                    AmountTotal = 1000,
                    Created = DateTime.UtcNow,
                    Metadata = new Dictionary<string, string> { ["userId"] = "6" }
                });

            var controller = new AdminController(context, stripeService.Object);

            var result = await controller.SyncHistoricalPayments(new List<string> { "sess_noaddr" });

            Assert.IsType<OkObjectResult>(result);
            var order = context.Orders.First();
            Assert.Equal("Historical order - address not recorded", order.ShippingAddress);
        }

        [Fact]
        public async Task SyncHistoricalPayments_Exception_IncrementsErrorCount()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.GetSessionAsync("sess_err"))
                .ThrowsAsync(new Exception("Stripe API error"));

            var controller = new AdminController(db.Context, stripeService.Object);

            var result = await controller.SyncHistoricalPayments(new List<string> { "sess_err" });

            var ok = Assert.IsType<OkObjectResult>(result);
            var errorCount = (int?)ok.Value?.GetType().GetProperty("errorCount")?.GetValue(ok.Value);
            Assert.Equal(1, errorCount);
        }

        [Fact]
        public async Task SyncHistoricalPayments_MultipleSessionsMixed_CountsCorrectly()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            await context.SaveChangesAsync();

            var stripeService = new Mock<IStripeService>();
            // Success session
            stripeService
                .Setup(s => s.GetSessionAsync("sess_good"))
                .ReturnsAsync(new Session
                {
                    PaymentStatus = "paid",
                    AmountTotal = 1000,
                    Created = DateTime.UtcNow,
                    Metadata = new Dictionary<string, string> { ["userId"] = "1" }
                });
            // Null session
            stripeService
                .Setup(s => s.GetSessionAsync("sess_null"))
                .ReturnsAsync((Session?)null);

            var controller = new AdminController(context, stripeService.Object);

            var result = await controller.SyncHistoricalPayments(new List<string> { "sess_good", "sess_null" });

            var ok = Assert.IsType<OkObjectResult>(result);
            var totalProcessed = (int?)ok.Value?.GetType().GetProperty("totalProcessed")?.GetValue(ok.Value);
            var successCount = (int?)ok.Value?.GetType().GetProperty("successCount")?.GetValue(ok.Value);
            var errorCount = (int?)ok.Value?.GetType().GetProperty("errorCount")?.GetValue(ok.Value);
            Assert.Equal(2, totalProcessed);
            Assert.Equal(1, successCount);
            Assert.Equal(1, errorCount);
        }

        // ──── TestWebhookConfig ────

        [Fact]
        public void TestWebhookConfig_ReturnsOkWithInfo()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var stripeService = new Mock<IStripeService>();
            var controller = new AdminController(db.Context, stripeService.Object);

            var result = controller.TestWebhookConfig();

            var ok = Assert.IsType<OkObjectResult>(result);
            var message = ok.Value?.GetType().GetProperty("message")?.GetValue(ok.Value)?.ToString();
            Assert.Equal("Webhook endpoint is reachable", message);
        }

        // ──── DebugOrders ────

        [Fact]
        public async Task DebugOrders_NoUserId_ReturnsUnauthorized()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var stripeService = new Mock<IStripeService>();
            var controller = new AdminController(db.Context, stripeService.Object);
            // No user claims set → UserId will be null
            TestControllerContext.SetUser(controller, userId: 0);
            // Override with empty claims to simulate missing UserId
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext()
            };

            var result = await controller.DebugOrders();

            var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal("User not authenticated", unauthorized.Value);
        }

        [Fact]
        public async Task DebugOrders_UserWithOrders_ReturnsOrders()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(10, "user10@example.com"));
            context.Orders.Add(TestDataBuilder.CreateOrder(1, userId: 10, status: "Pending"));
            await context.SaveChangesAsync();

            var stripeService = new Mock<IStripeService>();
            var controller = new AdminController(context, stripeService.Object);
            TestControllerContext.SetUser(controller, userId: 10);

            var result = await controller.DebugOrders();

            var ok = Assert.IsType<OkObjectResult>(result);
            var totalOrders = (int?)ok.Value?.GetType().GetProperty("totalOrders")?.GetValue(ok.Value);
            Assert.Equal(1, totalOrders);
        }

        [Fact]
        public async Task DebugOrders_UserWithNoOrders_ReturnsNoOrdersMessage()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(11, "user11@example.com"));
            await context.SaveChangesAsync();

            var stripeService = new Mock<IStripeService>();
            var controller = new AdminController(context, stripeService.Object);
            TestControllerContext.SetUser(controller, userId: 11);

            var result = await controller.DebugOrders();

            var ok = Assert.IsType<OkObjectResult>(result);
            var message = ok.Value?.GetType().GetProperty("message")?.GetValue(ok.Value)?.ToString();
            Assert.Contains("NO ORDERS FOUND", message);
        }
    }
}
