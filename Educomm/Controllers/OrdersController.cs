using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrdersController(AppDbContext context)
        {
            _context = context;
        }

        //POST Api
        [HttpPost("Checkout/{userId}")]
        public async Task<ActionResult<Order>> Checkout(int userId, [FromBody] string shippingAddress)
        {
            //get cart the get cart item then get kit 
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Kit)
            //Default is important because if we dont have item what to do. Earlier FirstAsync was creating problem when handling cases their is no such thing
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null || !cart.CartItems.Any())
            {
                return BadRequest("Cart is empty.");
            }

            //Check stock
            var cartItemsList = cart.CartItems.ToList();

            for (int i = 0; i < cartItemsList.Count; i++)
            {
                var item = cartItemsList[i]; // This works now!

                if (item.Kit.StockQuantity < item.Quantity)
                {
                    return BadRequest($"Not enough stock...");
                }
            }

            //Order creation
            var order = new Order
            {
                UserId = userId,
                ShippingAddress = shippingAddress,
                TotalAmount = cart.CartItems.Sum(i => i.Quantity * i.Kit.Price),
                Status = "Pending",
                OrderDate = DateTime.UtcNow
            };

            //minus from Stock
            for (int i = 0; i < cartItemsList.Count; i++)
            {
                var cartItem = cartItemsList[i];

                cartItem.Kit.StockQuantity -= cartItem.Quantity;

                //Receipt Line orderitem thing
                var orderItem = new OrderItem
                {
                    KitId = cartItem.KitId,
                    Quantity = cartItem.Quantity,
                    PriceAtPurchase = cartItem.Kit.Price
                };
                order.OrderItems.Add(orderItem);
            }

            _context.Orders.Add(order);

            //Empting Cart
            _context.CartItems.RemoveRange(cart.CartItems);

            await _context.SaveChangesAsync();
            return Ok(order);
        }

        //GET api
        [HttpGet("User/{userId}")]
        public async Task<ActionResult<IEnumerable<Order>>> GetUserOrders(int userId)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Kit)
                .Where(o => o.UserId == userId)
                .ToListAsync();
        }
    }
}