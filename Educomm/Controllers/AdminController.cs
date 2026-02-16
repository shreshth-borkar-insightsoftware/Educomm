using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;
using Educomm.Services;
using Stripe.Checkout;

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IStripeService _stripeService;

        public AdminController(AppDbContext context, IStripeService stripeService)
        {
            _context = context;
            _stripeService = stripeService;
        }

        /// <summary>
        /// TEMPORARY ENDPOINT: Sync historical Stripe payments to create missing orders
        /// Use this ONCE to fix orders from payments made before webhook was properly configured
        /// </summary>
        [HttpPost("sync-historical-payments")]
        public async Task<ActionResult> SyncHistoricalPayments([FromBody] List<string> sessionIds)
        {
            if (sessionIds == null || !sessionIds.Any())
            {
                return BadRequest("Please provide a list of Stripe session IDs to sync.");
            }

            var results = new List<object>();
            var successCount = 0;
            var errorCount = 0;

            foreach (var sessionId in sessionIds)
            {
                try
                {
                    Console.WriteLine($"[SYNC] Processing session: {sessionId}");

                    // Get session details from Stripe
                    var session = await _stripeService.GetSessionAsync(sessionId);

                    if (session == null)
                    {
                        results.Add(new { sessionId, status = "error", message = "Session not found in Stripe" });
                        errorCount++;
                        continue;
                    }

                    if (session.PaymentStatus != "paid")
                    {
                        results.Add(new { sessionId, status = "skipped", message = $"Payment not completed: {session.PaymentStatus}" });
                        continue;
                    }

                    // Extract userId from metadata
                    if (session.Metadata == null || !session.Metadata.ContainsKey("userId"))
                    {
                        results.Add(new { sessionId, status = "error", message = "No userId in session metadata" });
                        errorCount++;
                        continue;
                    }

                    var userId = int.Parse(session.Metadata["userId"]);

                    // Check if order already exists
                    var amountToMatch = (decimal)(session.AmountTotal ?? 0);
                    var existingOrder = await _context.Orders
                        .AnyAsync(o => o.UserId == userId && 
                                      ((o.TotalAmount * 100) - amountToMatch) > -1 &&
                                      ((o.TotalAmount * 100) - amountToMatch) < 1);

                    if (existingOrder)
                    {
                        results.Add(new { sessionId, status = "skipped", message = "Order already exists" });
                        continue;
                    }

                    // Get shipping address from metadata
                    string shippingAddress = "Historical order - address not recorded";
                    if (session.Metadata.ContainsKey("shippingAddress"))
                    {
                        shippingAddress = session.Metadata["shippingAddress"];
                    }

                    // Create order with historical data
                    var order = new Order
                    {
                        UserId = userId,
                        OrderDate = session.Created,
                        TotalAmount = (decimal)(session.AmountTotal ?? 0) / 100,
                        Status = "Confirmed", // Payment was successful
                        ShippingAddress = shippingAddress,
                        OrderItems = new List<OrderItem>()
                    };

                    // Note: We can't recreate exact cart items for historical orders
                    // Add a placeholder item or skip if critical
                    // For now, create order without items (admin can manually add if needed)

                    _context.Orders.Add(order);
                    await _context.SaveChangesAsync();

                    results.Add(new { 
                        sessionId, 
                        status = "success", 
                        orderId = order.OrderId,
                        amount = order.TotalAmount,
                        userId = userId
                    });
                    successCount++;

                    Console.WriteLine($"[SYNC] Created order {order.OrderId} for session {sessionId}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[SYNC] Error processing {sessionId}: {ex.Message}");
                    results.Add(new { sessionId, status = "error", message = ex.Message });
                    errorCount++;
                }
            }

            return Ok(new
            {
                totalProcessed = sessionIds.Count,
                successCount,
                errorCount,
                results
            });
        }

        /// <summary>
        /// Test webhook endpoint connectivity
        /// </summary>
        [HttpGet("test-webhook-config")]
        [AllowAnonymous]
        public ActionResult TestWebhookConfig()
        {
            return Ok(new
            {
                message = "Webhook endpoint is reachable",
                endpoint = "/api/payment/webhook",
                timestamp = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Debug endpoint to check database orders vs Stripe payments
        /// </summary>
        [HttpGet("debug-orders")]
        public async Task<ActionResult> DebugOrders()
        {
            var userId = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            var userIdInt = int.Parse(userId);

            // Get all orders for this user
            var orders = await _context.Orders
                .Where(o => o.UserId == userIdInt)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new
                {
                    o.OrderId,
                    o.OrderDate,
                    o.TotalAmount,
                    o.Status,
                    ItemCount = o.OrderItems.Count
                })
                .ToListAsync();

            // Get user info
            var user = await _context.Users.FindAsync(userIdInt);

            return Ok(new
            {
                userId = userIdInt,
                userEmail = user?.Email,
                totalOrders = orders.Count,
                orders = orders,
                message = orders.Count == 0 
                    ? "NO ORDERS FOUND - Webhook was never called for your payments" 
                    : $"Found {orders.Count} order(s)"
            });
        }
    }
}
