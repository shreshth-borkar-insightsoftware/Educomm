using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrdersController(AppDbContext context)
        {
            _context = context;
        }

        // Helper to get ID from Token (Private method)
        private int GetUserId()
        {
            var idClaim = User.FindFirst("UserId");
            if (idClaim == null) return 0;
            return int.Parse(idClaim.Value);
        }

        // POST Api: Checkout
        [HttpPost("Checkout")]
        public async Task<ActionResult<Order>> Checkout([FromBody] string shippingAddress)
        {
            Console.WriteLine("--- CHECKOUT PROCESS STARTED ---");

            // Start a transaction to ensure either everything saves or nothing saves
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                int userId = GetUserId(); // Securely get ID from token
                Console.WriteLine($"DEBUG: User ID from token: {userId}");

                // 1. Get cart, cart items, and the kits attached to them
                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Kit)
                    .FirstOrDefaultAsync(c => c.UserId == userId);

                if (cart == null || !cart.CartItems.Any())
                {
                    Console.WriteLine("DEBUG: Checkout failed - Cart is empty.");
                    return BadRequest("Cart is empty.");
                }

                Console.WriteLine($"DEBUG: Found cart with {cart.CartItems.Count} items.");

                // 2. Check stock for all items before doing anything else
                foreach (var item in cart.CartItems)
                {
                    if (item.Kit.StockQuantity < item.Quantity)
                    {
                        Console.WriteLine($"DEBUG: Stock fail for {item.Kit.Name}.");
                        return BadRequest($"Not enough stock for {item.Kit.Name}.");
                    }
                }

                // 3. Initialize the Order object
                var order = new Order
                {
                    UserId = userId,
                    ShippingAddress = shippingAddress,
                    TotalAmount = cart.CartItems.Sum(i => i.Quantity * i.Kit.Price),
                    Status = "Pending",
                    OrderDate = DateTime.UtcNow,
                    OrderItems = new List<OrderItem>() // Crucial initialization to prevent NullReference
                };

                // 4. Process each item: Stock update, Item creation, and Enrollment
                foreach (var cartItem in cart.CartItems.ToList())
                {
                    // Subtract Stock
                    cartItem.Kit.StockQuantity -= cartItem.Quantity;

                    // Create the individual Order Item
                    var orderItem = new OrderItem
                    {
                        KitId = cartItem.KitId,
                        Quantity = cartItem.Quantity,
                        PriceAtPurchase = cartItem.Kit.Price
                    };
                    order.OrderItems.Add(orderItem);

                    // Enrollment Logic: If the kit is linked to a course, enroll the user
                    if (cartItem.Kit.CourseId != null)
                    {
                        bool alreadyEnrolled = await _context.Enrollments
                            .AnyAsync(e => e.UserId == userId && e.CourseId == cartItem.Kit.CourseId);

                        if (!alreadyEnrolled)
                        {
                            var newEnrollment = new Enrollments
                            {
                                UserId = userId,
                                CourseId = (int)cartItem.Kit.CourseId,
                                EnrolledAt = DateTime.UtcNow,
                                ProgressPercentage = 0,
                                IsCompleted = false
                            };
                            _context.Enrollments.Add(newEnrollment);
                        }
                    }
                }

                // 5. Save changes and empty the cart
                _context.Orders.Add(order);
                _context.CartItems.RemoveRange(cart.CartItems);

                Console.WriteLine("DEBUG: Attempting final SaveChangesAsync...");
                await _context.SaveChangesAsync();

                // Commit the transaction to the database
                await transaction.CommitAsync();

                Console.WriteLine($"SUCCESS: Order #{order.OrderId} created in DB.");
                return Ok(order);
            }
            catch (Exception ex)
            {
                // If anything goes wrong, undo all database changes made during this request
                await transaction.RollbackAsync();

                Console.WriteLine($"CRITICAL ERROR: {ex.Message}");
                Console.WriteLine($"STACK TRACE: {ex.StackTrace}");

                return StatusCode(500, $"Internal Server Error: {ex.Message}");
            }
        }

        // GET Api: My Orders
        [HttpGet("MyOrders")]
        public async Task<ActionResult<IEnumerable<Order>>> GetMyOrders()
        {
            int userId = GetUserId();

            return await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Kit)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate) // Newest first
                .ToListAsync();
        }

        // GET Api: Admin View All Orders
        [HttpGet("Admin/AllOrders")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<Order>>> GetAllOrders()
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Kit)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        // PUT Api: Update Order Status (Admin)
        [HttpPut("Admin/UpdateStatus/{orderId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateOrderStatus(int orderId, [FromBody] string newStatus)
        {
            var order = await _context.Orders.FindAsync(orderId);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            order.Status = newStatus;
            await _context.SaveChangesAsync();

            return Ok($"Order #{orderId} status updated to {newStatus}");
        }
    }
}