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
    public class CartsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CartsController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var idClaim = this.User.FindFirst("UserId");
            if (idClaim == null) return 0;
            return int.Parse(idClaim.Value);
        }

        // GET: api/Carts/MyCart
        [HttpGet("MyCart")]
        public async Task<ActionResult<Cart>> GetMyCart()
        {
            int userId = GetUserId(); //Securely get ID from token

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Kit)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                return NotFound("No cart found for this user.");
            }

            return cart;
        }

        // POST: api/Carts/Add
        [HttpPost("Add")]
        public async Task<ActionResult<Cart>> AddToCart(int kitId, int quantity)
        {
            int userId = GetUserId();

            //Find user cart
            var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId);

            //If no cart exists, create one
            if (cart == null)
            {
                cart = new Cart { UserId = userId };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            //Check if item already exists in cart
            var existingItem = await _context.CartItems
                .FirstOrDefaultAsync(ci => ci.CartId == cart.CartId && ci.KitId == kitId);

            if (existingItem != null)
            {
                existingItem.Quantity += quantity;
            }
            else
            {
                var newItem = new CartItem
                {
                    CartId = cart.CartId,
                    KitId = kitId,
                    Quantity = quantity
                };
                _context.CartItems.Add(newItem);
            }

            await _context.SaveChangesAsync();

            // Return updated cart
            return await GetMyCart();
        }

        // DELETE: api/Carts/RemoveItem/5
        [HttpDelete("RemoveItem/{cartItemId}")]
        public async Task<IActionResult> RemoveCartItem(int cartItemId)
        {
            int userId = GetUserId();

            // Find the item AND include the Cart to check ownership
            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .FirstOrDefaultAsync(ci => ci.CartItemId == cartItemId);

            if (cartItem == null)
            {
                return NotFound("Item not found.");
            }

            if (cartItem.Cart.UserId != userId)
            {
                return Unauthorized("You cannot delete items from someone else's cart.");
            }

            _context.CartItems.Remove(cartItem);
            await _context.SaveChangesAsync();

            return Ok("Item removed.");
        }

        // DELETE: api/Carts/Clear
        [HttpDelete("Clear")]
        public async Task<IActionResult> ClearCart()
        {
            int userId = GetUserId();

            // Find the logged-in user's cart
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null || !cart.CartItems.Any())
            {
                return NotFound("Cart is already empty.");
            }

            _context.CartItems.RemoveRange(cart.CartItems);
            await _context.SaveChangesAsync();

            return Ok("Cart emptied.");
        }
    }
}