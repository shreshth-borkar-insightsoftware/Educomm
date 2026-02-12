using Educomm.Controllers;
using Educomm.Models;
using Educomm.Services;
using Educomm.Tests.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;
using Stripe;
using Stripe.Checkout;
using System.Text;
using Xunit;

namespace Educomm.Tests.Controllers
{
    public class PaymentControllerTests
    {
        private static IConfiguration BuildConfig()
        {
            return new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Stripe:WebhookSecret"] = "whsec_test"
                })
                .Build();
        }

        [Fact]
        public async Task CreateCheckoutSession_EmptyCart_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var stripeService = new Mock<IStripeService>();
            var controller = new PaymentController(context, BuildConfig(), stripeService.Object);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.CreateCheckoutSession(new CreateCheckoutRequest
            {
                ShippingAddress = "Test Address"
            });

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Cart is empty.", badRequest.Value);
        }

        [Fact]
        public async Task CreateCheckoutSession_WithItems_ReturnsSession()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1));
            context.Carts.Add(TestDataBuilder.CreateCart(1, userId: 1));
            context.CartItems.Add(TestDataBuilder.CreateCartItem(1, cartId: 1, kitId: 1, quantity: 1));
            await context.SaveChangesAsync();

            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.CreateCheckoutSessionAsync(It.IsAny<SessionCreateOptions>()))
                .ReturnsAsync(new Session { Id = "sess_123", Url = "https://stripe.test/checkout" });

            var controller = new PaymentController(context, BuildConfig(), stripeService.Object);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.CreateCheckoutSession(new CreateCheckoutRequest
            {
                ShippingAddress = "Test Address"
            });

            var ok = Assert.IsType<OkObjectResult>(result);
            var sessionId = ok.Value?.GetType().GetProperty("sessionId")?.GetValue(ok.Value)?.ToString();
            var sessionUrl = ok.Value?.GetType().GetProperty("sessionUrl")?.GetValue(ok.Value)?.ToString();
            Assert.Equal("sess_123", sessionId);
            Assert.Equal("https://stripe.test/checkout", sessionUrl);
        }

        [Fact]
        public async Task VerifySession_Paid_ReturnsSuccess()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.GetSessionAsync("sess_paid"))
                .ReturnsAsync(new Session
                {
                    PaymentStatus = "paid",
                    AmountTotal = 1200,
                    Metadata = new Dictionary<string, string> { ["userId"] = "3" }
                });

            var controller = new PaymentController(context, BuildConfig(), stripeService.Object);

            var result = await controller.VerifySession("sess_paid");

            var ok = Assert.IsType<OkObjectResult>(result);
            var success = (bool?)ok.Value?.GetType().GetProperty("success")?.GetValue(ok.Value);
            var userId = (int?)ok.Value?.GetType().GetProperty("userId")?.GetValue(ok.Value);
            Assert.True(success);
            Assert.Equal(3, userId);
        }

        [Fact]
        public async Task VerifySession_NotFound_ReturnsNotFound()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.GetSessionAsync("missing"))
                .ReturnsAsync((Session?)null);

            var controller = new PaymentController(context, BuildConfig(), stripeService.Object);

            var result = await controller.VerifySession("missing");

            var notFound = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Session not found.", notFound.Value);
        }

        [Fact]
        public async Task VerifySession_NotPaid_ReturnsSuccessFalse()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.GetSessionAsync("sess_unpaid"))
                .ReturnsAsync(new Session
                {
                    PaymentStatus = "unpaid",
                    Metadata = new Dictionary<string, string>()
                });

            var controller = new PaymentController(context, BuildConfig(), stripeService.Object);

            var result = await controller.VerifySession("sess_unpaid");

            var ok = Assert.IsType<OkObjectResult>(result);
            var success = (bool?)ok.Value?.GetType().GetProperty("success")?.GetValue(ok.Value);
            Assert.False(success);
        }

        [Fact]
        public async Task StripeWebhook_MissingUserId_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.ConstructEvent(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .Returns(new Event
                {
                    Type = "checkout.session.completed",
                    Data = new EventData
                    {
                        Object = new Session { Metadata = new Dictionary<string, string>() }
                    }
                });

            var controller = new PaymentController(context, BuildConfig(), stripeService.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
            controller.HttpContext.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes("{}"));
            controller.HttpContext.Request.Headers["Stripe-Signature"] = "sig";

            var result = await controller.StripeWebhook();

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("userId not found in metadata", badRequest.Value);
        }

        [Fact]
        public async Task StripeWebhook_Success_CreatesOrderAndClearsCart()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(7, "user7@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1));
            context.Carts.Add(TestDataBuilder.CreateCart(1, userId: 7));
            context.CartItems.Add(TestDataBuilder.CreateCartItem(1, cartId: 1, kitId: 1, quantity: 2));
            await context.SaveChangesAsync();

            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.ConstructEvent(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .Returns(new Event
                {
                    Type = "checkout.session.completed",
                    Data = new EventData
                    {
                        Object = new Session
                        {
                            AmountTotal = 5000,
                            Metadata = new Dictionary<string, string>
                            {
                                ["userId"] = "7",
                                ["shippingAddress"] = "Ship to test"
                            }
                        }
                    }
                });

            var controller = new PaymentController(context, BuildConfig(), stripeService.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
            controller.HttpContext.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes("{}"));
            controller.HttpContext.Request.Headers["Stripe-Signature"] = "sig";

            var result = await controller.StripeWebhook();

            Assert.IsType<OkResult>(result);
            Assert.Single(context.Orders);
            Assert.Empty(context.CartItems);
        }

        [Fact]
        public async Task StripeWebhook_NonCheckoutEvent_ReturnsOk()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.ConstructEvent(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .Returns(new Event
                {
                    Type = "payment_intent.succeeded",
                    Data = new EventData { Object = new Session() }
                });

            var controller = new PaymentController(context, BuildConfig(), stripeService.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
            controller.HttpContext.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes("{}"));
            controller.HttpContext.Request.Headers["Stripe-Signature"] = "sig";

            var result = await controller.StripeWebhook();

            Assert.IsType<OkResult>(result);
        }

        [Fact]
        public async Task StripeWebhook_EmptyCart_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(7, "user7@example.com"));
            await context.SaveChangesAsync();

            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.ConstructEvent(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .Returns(new Event
                {
                    Type = "checkout.session.completed",
                    Data = new EventData
                    {
                        Object = new Session
                        {
                            AmountTotal = 5000,
                            Metadata = new Dictionary<string, string>
                            {
                                ["userId"] = "7",
                                ["shippingAddress"] = "Ship to test"
                            }
                        }
                    }
                });

            var controller = new PaymentController(context, BuildConfig(), stripeService.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
            controller.HttpContext.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes("{}"));
            controller.HttpContext.Request.Headers["Stripe-Signature"] = "sig";

            var result = await controller.StripeWebhook();

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Cart is empty", badRequest.Value);
        }

        [Fact]
        public async Task StripeWebhook_DuplicateOrder_ReturnsOkWithoutNewOrder()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(7, "user7@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1));
            context.Carts.Add(TestDataBuilder.CreateCart(1, userId: 7));
            context.CartItems.Add(TestDataBuilder.CreateCartItem(1, cartId: 1, kitId: 1, quantity: 2));
            context.Orders.Add(new Educomm.Models.Order
            {
                UserId = 7,
                Status = "Confirmed",
                OrderDate = DateTime.UtcNow,
                ShippingAddress = "Existing",
                TotalAmount = 50
            });
            await context.SaveChangesAsync();

            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.ConstructEvent(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .Returns(new Event
                {
                    Type = "checkout.session.completed",
                    Data = new EventData
                    {
                        Object = new Session
                        {
                            AmountTotal = 5000,
                            Metadata = new Dictionary<string, string>
                            {
                                ["userId"] = "7",
                                ["shippingAddress"] = "Ship to test"
                            }
                        }
                    }
                });

            var controller = new PaymentController(context, BuildConfig(), stripeService.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
            controller.HttpContext.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes("{}"));
            controller.HttpContext.Request.Headers["Stripe-Signature"] = "sig";

            var result = await controller.StripeWebhook();

            Assert.IsType<OkResult>(result);
            Assert.Single(context.Orders);
        }
    }
}
