using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KitsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public KitsController(AppDbContext context)
        {
            _context = context;
        }

        //GET api
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Kit>>> GetKits()
        {
            return await _context.Kits
                .Include(k => k.Category)
                .Include(k => k.Course)
              .ToListAsync();
        }
        [HttpPost]
        public async Task<ActionResult<Kit>> PostKit(Kit kit)
        {
            var categoryExists = await _context.Categories.AnyAsync(c => c.CategoryId == kit.CategoryId);
            if (!categoryExists)
            {
                return BadRequest("Invalid CategoryId.");
            }

            if (kit.CourseId != null)
            {
                var courseExists = await _context.Courses.AnyAsync(c => c.CourseId == kit.CourseId);
                if (!courseExists)
                {
                    return BadRequest("Invalid CourseId.");
                }
            }

            _context.Kits.Add(kit);
            await _context.SaveChangesAsync();

            return Ok(kit);
        }

        //PUT api
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateKit(int id, Kit kit)
        {
            if (id != kit.KitId)
            {
                return BadRequest("ID mismatch.");
            }

            _context.Entry(kit).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Kits.Any(e => e.KitId == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }
    }
}