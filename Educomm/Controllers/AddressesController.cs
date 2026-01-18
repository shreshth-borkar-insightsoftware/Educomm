using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AddressesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AddressesController(AppDbContext context)
        {
            _context = context;
        }
        
        //GET: api
        [HttpGet("User/{userId}")]
        public async Task<ActionResult<IEnumerable<Address>>> GetUserAddresses(int userId)
        {
            return await _context.Addresses
                .Where(a => a.UserId == userId)
                .ToListAsync();
        }

        //POST: api
        [HttpPost]
        public async Task<ActionResult<Address>> PostAddress(Address address)
        {
            var userExists = await _context.Users.AnyAsync(u => u.UserId == address.UserId);
            if (!userExists)
            {
                return BadRequest("Invalid UserId.");
            }

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            return Ok(address);
        }

        //DELETE api
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAddress(int id)
        {
            var address = await _context.Addresses.FindAsync(id);
            if (address == null) return NotFound();

            _context.Addresses.Remove(address);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}