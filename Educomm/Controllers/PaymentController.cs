using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;
using Stripe;
using Stripe.Checkout;
using Educomm.Services;
using System.Security.Claims;
using System.Text.Json;

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IStripeService _stripeService;

        public PaymentController(AppDbContext context, IConfiguration configuration, IStripeService stripeService)
        {
            _context = context;
            _configuration = configuration;
            _stripeService = stripeService;
        }

        // Helper to get ID from Token
        private int GetUserId()
        {
            var idClaim = User.FindFirst("UserId");
            if (idClaim == null) return 0;
            return int.Parse(idClaim.Value);
        }

        // POST: api/payment/create-checkout-session
        [HttpPost("create-checkout-session")]
        public async Task<ActionResult> CreateCheckoutSession([FromBody] CreateCheckoutRequest request)
        {
            try
            {
                int userId = GetUserId();
                Console.WriteLine($"DEBUG: Creating checkout session for User ID: {userId}");

                // Get the user's cart with cart items and kits
                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Kit)
                    .FirstOrDefaultAsync(c => c.UserId == userId);

                if (cart == null || !cart.CartItems.Any())
                {
                    Console.WriteLine("DEBUG: Cart is empty.");
                    return BadRequest("Cart is empty.");
                }

                Console.WriteLine($"DEBUG: Found cart with {cart.CartItems.Count} items.");

                // Build Stripe line items from cart items
                var lineItems = new List<SessionLineItemOptions>();

                foreach (var cartItem in cart.CartItems)
                {
                    lineItems.Add(new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            UnitAmount = (long)(cartItem.Kit.Price * 100), // Stripe uses cents
                            Currency = "inr", // Indian Rupees
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = cartItem.Kit.Name,
                                Description = cartItem.Kit.Description,
                            },
                        },
                        Quantity = cartItem.Quantity,
                    });
                }

                Console.WriteLine($"DEBUG: Created {lineItems.Count} line items for Stripe.");

                // Create Stripe Checkout Session
                var options = new SessionCreateOptions
                {
                    PaymentMethodTypes = new List<string>
                    {
                        "card",
                    },
                    LineItems = lineItems,
                    Mode = "payment",
                    SuccessUrl = $"http://localhost:5173/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                    CancelUrl = "http://localhost:5173/payment/cancel",
                    Metadata = new Dictionary<string, string>
                    {
                        { "userId", userId.ToString() },
                        { "shippingAddress", request?.ShippingAddress ?? "Address not provided" }
                    }
                };

                Session session = await _stripeService.CreateCheckoutSessionAsync(options);

                Console.WriteLine($"DEBUG: Stripe session created: {session.Id}");

                return Ok(new
                {
                    sessionId = session.Id,
                    sessionUrl = session.Url
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: {ex.Message}");
                return StatusCode(500, new { message = "Failed to create checkout session", error = ex.Message });
            }
        }

        // POST: api/payment/webhook
        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> StripeWebhook()
        {
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
            var stripeSignature = Request.Headers["Stripe-Signature"];
            var webhookSecret = _configuration["Stripe:WebhookSecret"];

            try
            {
                var stripeEvent = _stripeService.ConstructEvent(
                    json,
                    stripeSignature,
                    webhookSecret
                );

                Console.WriteLine($"[WEBHOOK] Received event: {stripeEvent.Type}");

                // Handle checkout.session.completed event
                if (stripeEvent.Type == "checkout.session.completed")
                {
                    var session = stripeEvent.Data.Object as Session;
                    Console.WriteLine($"[WEBHOOK] Processing completed session: {session?.Id}");

                    // Get userId from metadata
                    if (session?.Metadata == null || !session.Metadata.ContainsKey("userId"))
                    {
                        Console.WriteLine("[WEBHOOK] ERROR: userId not found in session metadata");
                        return BadRequest("userId not found in metadata");
                    }

                    var userId = int.Parse(session.Metadata["userId"]);
                    Console.WriteLine($"[WEBHOOK] Creating order for user: {userId}");

                    // Get shipping address from metadata
                    string shippingAddress = "Address not provided";
                    if (session.Metadata.ContainsKey("shippingAddress"))
                    {
                        shippingAddress = session.Metadata["shippingAddress"];
                    }

                    // Get user's cart
                    var cart = await _context.Carts
                        .Include(c => c.CartItems)
                        .ThenInclude(ci => ci.Kit)
                        .FirstOrDefaultAsync(c => c.UserId == userId);

                    if (cart == null || !cart.CartItems.Any())
                    {
                        Console.WriteLine($"[WEBHOOK] ERROR: Cart not found or empty for user {userId}");
                        return BadRequest("Cart is empty");
                    }

                    // Check if order already exists for this session (prevent duplicates)
                    var existingOrder = await _context.Orders
                        .FirstOrDefaultAsync(o => o.UserId == userId && o.Status == "Completed" && 
                            o.OrderDate > DateTime.UtcNow.AddMinutes(-5));

                    if (existingOrder != null)
                    {
                        Console.WriteLine($"[WEBHOOK] Order already exists, skipping duplicate");
                        return Ok(); // Already processed
                    }

                    // Create the order
                    var order = new Order
                    {
                        UserId = userId,
                        OrderDate = DateTime.UtcNow,
                        TotalAmount = (decimal)(session.AmountTotal ?? 0) / 100, // Convert from cents
                        Status = "Completed", // Payment already successful
                        ShippingAddress = shippingAddress,
                        OrderItems = new List<OrderItem>()
                    };

                    // Add order items from cart
                    foreach (var cartItem in cart.CartItems)
                    {
                        order.OrderItems.Add(new OrderItem
                        {
                            KitId = cartItem.KitId,
                            Quantity = cartItem.Quantity,
                            PriceAtPurchase = cartItem.Kit.Price
                        });
                    }

                    _context.Orders.Add(order);

                    // Clear the cart
                    _context.CartItems.RemoveRange(cart.CartItems);

                    await _context.SaveChangesAsync();

                    Console.WriteLine($"[WEBHOOK] Order created successfully: OrderId={order.OrderId}");
                }

                return Ok();
            }
            catch (StripeException e)
            {
                Console.WriteLine($"[WEBHOOK] Stripe error: {e.Message}");
                return BadRequest();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WEBHOOK] Error: {ex.Message}");
                return StatusCode(500, ex.Message);
            }
        }

        // GET: api/payment/verify-session/{sessionId}
        [HttpGet("verify-session/{sessionId}")]
        public async Task<ActionResult> VerifySession(string sessionId)
        {
            try
            {
                Console.WriteLine($"DEBUG: Verifying session: {sessionId}");

                var session = await _stripeService.GetSessionAsync(sessionId);

                if (session == null)
                {
                    return NotFound("Session not found.");
                }

                Console.WriteLine($"DEBUG: Session payment status: {session.PaymentStatus}");

                if (session.PaymentStatus == "paid")
                {
                    var userIdStr = session.Metadata.ContainsKey("userId") ? session.Metadata["userId"] : null;

                    if (string.IsNullOrEmpty(userIdStr))
                    {
                        return BadRequest("User ID not found in session metadata.");
                    }

                    return Ok(new
                    {
                        success = true,
                        userId = int.Parse(userIdStr),
                        paymentStatus = session.PaymentStatus,
                        amountTotal = session.AmountTotal / 100.0 // Convert from cents to rupees
                    });
                }
                else
                {
                    return Ok(new
                    {
                        success = false,
                        paymentStatus = session.PaymentStatus
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: {ex.Message}");
                return StatusCode(500, new { message = "Failed to verify session", error = ex.Message });
            }
        }
    }

    public class CreateCheckoutRequest
    {
        public string? ShippingAddress { get; set; }
    }
}
