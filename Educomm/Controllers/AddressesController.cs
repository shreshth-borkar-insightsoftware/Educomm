using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;
using Microsoft.AspNetCore.Authorization;


namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AddressesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AddressesController(AppDbContext context)
        {
            _context = context;
        }

        // Helper to get ID from Token
        private int GetUserId()
        {
            var idClaim = User.FindFirst("UserId");
            if (idClaim == null) return 0;
            return int.Parse(idClaim.Value);
        }

        //GET: api
        [HttpGet("MyAddresses")]
        public async Task<ActionResult<IEnumerable<Address>>> GetMyAddresses()
        {
            int userId = GetUserId();

            return await _context.Addresses
                .Where(a => a.UserId == userId)
                .ToListAsync();
        }

        //POST: api
        [HttpPost]
        public async Task<ActionResult<Address>> PostAddress(Address address)
        {
            int userId = GetUserId();

            // Securely link this address to the user who sent the request
            address.UserId = userId;

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            return Ok(address);
        }
    }
}