using Educomm.Controllers;
using Educomm.Models;
using Educomm.Services;
using Educomm.Tests.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Stripe.Checkout;
using System.Text;
using Xunit;

namespace Educomm.Tests.Integration
{
    /// <summary>
    /// Integration tests to catch webhook delivery failures and order creation issues
    /// These tests simulate the ACTUAL bug: payment succeeds but webhook fails to create order
    /// </summary>
    public class PaymentIntegrationTests
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
        public async Task PaymentFlow_WebhookFails_FallbackCreatesOrder()
        {
            // SCENARIO: Webhook fails (Stripe CLI not running), but verify-session creates order as fallback
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            
            context.Users.Add(TestDataBuilder.CreateUser(1, "user@test.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1));
            context.Carts.Add(TestDataBuilder.CreateCart(1, userId: 1));
            context.CartItems.Add(TestDataBuilder.CreateCartItem(1, cartId: 1, kitId: 1, quantity: 2));
            await context.SaveChangesAsync();

            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.GetSessionAsync("sess_paid"))
                .ReturnsAsync(new Session
                {
                    PaymentStatus = "paid",
                    AmountTotal = 2000,
                    Metadata = new Dictionary<string, string>
                    {
                        ["userId"] = "1",
                        ["shippingAddress"] = "123 Test St"
                    }
                });

            var controller = new PaymentController(context, BuildConfig(), stripeService.Object);

            // Simulate webhook NEVER being called (Stripe CLI not running)
            // User completes payment and frontend calls verify-session

            var result = await controller.VerifySession("sess_paid");

            // Verify session returns success
            var ok = Assert.IsType<OkObjectResult>(result);
            var success = (bool?)ok.Value?.GetType().GetProperty("success")?.GetValue(ok.Value);
            Assert.True(success);

            // CRITICAL: Order must be created by fallback mechanism
            var orders = await context.Orders.ToListAsync();
            Assert.Single(orders);
            Assert.Equal(1, orders[0].UserId);
            Assert.Equal("Completed", orders[0].Status);
            Assert.Equal(20m, orders[0].TotalAmount);

            // Cart must be cleared
            var cartItems = await context.CartItems.ToListAsync();
            Assert.Empty(cartItems);
        }

        [Fact]
        public async Task PaymentFlow_WebhookSucceeds_NoDuplicateOrder()
        {
            // SCENARIO: Webhook creates order, then verify-session is called - should not duplicate
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            
            context.Users.Add(TestDataBuilder.CreateUser(1, "user@test.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1));
            context.Carts.Add(TestDataBuilder.CreateCart(1, userId: 1));
            context.CartItems.Add(TestDataBuilder.CreateCartItem(1, cartId: 1, kitId: 1, quantity: 2));
            await context.SaveChangesAsync();

            var stripeService = new Mock<IStripeService>();
            var session = new Session
            {
                PaymentStatus = "paid",
                AmountTotal = 2000,
                Metadata = new Dictionary<string, string>
                {
                    ["userId"] = "1",
                    ["shippingAddress"] = "123 Test St"
                }
            };

            stripeService
                .Setup(s => s.ConstructEvent(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .Returns(new Stripe.Event
                {
                    Type = "checkout.session.completed",
                    Data = new Stripe.EventData { Object = session }
                });

            stripeService
                .Setup(s => s.GetSessionAsync("sess_paid"))
                .ReturnsAsync(session);

            var controller = new PaymentController(context, BuildConfig(), stripeService.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
            controller.HttpContext.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes("{}"));
            controller.HttpContext.Request.Headers["Stripe-Signature"] = "sig";

            // Step 1: Webhook creates order (normal flow)
            await controller.StripeWebhook();

            Assert.Single(context.Orders);

            // Step 2: User sees success page, calls verify-session
            var result = await controller.VerifySession("sess_paid");

            // Should still have only 1 order (no duplicate)
            Assert.Single(context.Orders);
        }

        [Fact]
        public async Task PaymentFlow_CartAlreadyCleared_HandlesGracefully()
        {
            // SCENARIO: Cart cleared by webhook, then verify-session called with empty cart
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            
            context.Users.Add(TestDataBuilder.CreateUser(1, "user@test.com"));
            context.Orders.Add(new Order
            {
                UserId = 1,
                Status = "Confirmed",
                OrderDate = DateTime.UtcNow,
                TotalAmount = 20m,
                ShippingAddress = "123 Test St"
            });
            await context.SaveChangesAsync();

            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.GetSessionAsync("sess_paid"))
                .ReturnsAsync(new Session
                {
                    PaymentStatus = "paid",
                    AmountTotal = 2000,
                    Metadata = new Dictionary<string, string>
                    {
                        ["userId"] = "1",
                        ["shippingAddress"] = "123 Test St"
                    }
                });

            var controller = new PaymentController(context, BuildConfig(), stripeService.Object);

            // Should not crash even though cart is empty (order already exists)
            var result = await controller.VerifySession("sess_paid");

            var ok = Assert.IsType<OkObjectResult>(result);
            var success = (bool?)ok.Value?.GetType().GetProperty("success")?.GetValue(ok.Value);
            Assert.True(success);
        }

        [Fact]
        public async Task PaymentFlow_OldOrderExists_NewOrderStillCreated()
        {
            // SCENARIO: User makes another purchase after 15 minutes - should create new order
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            
            context.Users.Add(TestDataBuilder.CreateUser(1, "user@test.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1));
            context.Carts.Add(TestDataBuilder.CreateCart(1, userId: 1));
            context.CartItems.Add(TestDataBuilder.CreateCartItem(1, cartId: 1, kitId: 1, quantity: 2));
            
            // Existing old order (from 15 minutes ago)
            context.Orders.Add(new Order
            {
                UserId = 1,
                Status = "Confirmed",
                OrderDate = DateTime.UtcNow.AddMinutes(-15),
                TotalAmount = 10m,
                ShippingAddress = "Old Address"
            });
            await context.SaveChangesAsync();

            var stripeService = new Mock<IStripeService>();
            stripeService
                .Setup(s => s.GetSessionAsync("sess_new"))
                .ReturnsAsync(new Session
                {
                    PaymentStatus = "paid",
                    AmountTotal = 2000,
                    Metadata = new Dictionary<string, string>
                    {
                        ["userId"] = "1",
                        ["shippingAddress"] = "New Address"
                    }
                });

            var controller = new PaymentController(context, BuildConfig(), stripeService.Object);

            await controller.VerifySession("sess_new");

            // Should have 2 orders (old + new)
            var orders = await context.Orders.ToListAsync();
            Assert.Equal(2, orders.Count);
            Assert.Contains(orders, o => o.ShippingAddress == "Old Address");
            Assert.Contains(orders, o => o.ShippingAddress == "New Address");
        }
    }
}
