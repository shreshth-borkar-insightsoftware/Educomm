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
        // CHANGED: Removed userId parameter. It gets ID from token now.
        [HttpPost("Checkout")]
        public async Task<ActionResult<Order>> Checkout([FromBody] string shippingAddress)
        {
            int userId = GetUserId(); // Securely get ID

            // get cart then get cart item then get kit 
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Kit)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null || !cart.CartItems.Any())
            {
                return BadRequest("Cart is empty.");
            }

            // Check stock logic (Your style)
            var cartItemsList = cart.CartItems.ToList();

            for (int i = 0; i < cartItemsList.Count; i++)
            {
                var item = cartItemsList[i];

                if (item.Kit.StockQuantity < item.Quantity)
                {
                    return BadRequest($"Not enough stock for {item.Kit.Name}.");
                }
            }

            // Order creation
            var order = new Order
            {
                UserId = userId,
                ShippingAddress = shippingAddress,
                TotalAmount = cart.CartItems.Sum(i => i.Quantity * i.Kit.Price),
                Status = "Pending",
                OrderDate = DateTime.UtcNow
            };

            // Minus from Stock & Add Items
            for (int i = 0; i < cartItemsList.Count; i++)
            {
                var cartItem = cartItemsList[i];

                //Subtract Stock
                cartItem.Kit.StockQuantity -= cartItem.Quantity;

                //Create Order Item
                var orderItem = new OrderItem
                {
                    KitId = cartItem.KitId,
                    Quantity = cartItem.Quantity,
                    PriceAtPurchase = cartItem.Kit.Price
                };
                order.OrderItems.Add(orderItem);

                //enrollment Logic
                if (cartItem.Kit.CourseId != null)
                {
                    //check if enrolled
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

            _context.Orders.Add(order);

            //emptying Cart
            _context.CartItems.RemoveRange(cart.CartItems);

            await _context.SaveChangesAsync();
            return Ok(order);
        }

        // GET Api only My Orders
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
        //admin 
        //This lets the Admin see everyone's orders
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

        //PUT for Update Status
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