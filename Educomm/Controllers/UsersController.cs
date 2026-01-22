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
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        //GET api
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }
    }
}