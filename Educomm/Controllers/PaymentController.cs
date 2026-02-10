using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Stripe.Checkout;
using System.Security.Claims;

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public PaymentController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
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
        public async Task<ActionResult> CreateCheckoutSession()
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
                        { "userId", userId.ToString() }
                    }
                };

                var service = new SessionService();
                Session session = await service.CreateAsync(options);

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

        // GET: api/payment/verify-session/{sessionId}
        [HttpGet("verify-session/{sessionId}")]
        public async Task<ActionResult> VerifySession(string sessionId)
        {
            try
            {
                Console.WriteLine($"DEBUG: Verifying session: {sessionId}");

                var service = new SessionService();
                var session = await service.GetAsync(sessionId);

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
}
