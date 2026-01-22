using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;
using Microsoft.AspNetCore.Authorization; // Security

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // 1. Must be logged in
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriesController(AppDbContext context)
        {
            _context = context;
        }

        // GET api
        // Public: Everyone needs to see categories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            return await _context.Categories.ToListAsync();
        }

        // POST api
        // RESTRICTED: Only Admin can create categories
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Category>> PostCategory(Category category)
        {
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            return Ok(category);
        }
    }
}