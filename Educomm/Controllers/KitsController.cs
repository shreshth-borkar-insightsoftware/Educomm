using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;
using Educomm.Models.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class KitsController : ControllerBase
    {
        private const int MAX_PAGE_SIZE = 100;
        private readonly AppDbContext _context;

        public KitsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Kits
        [HttpGet]
        public async Task<ActionResult<PaginatedResponse<Kit>>> GetKits(
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 12,
            [FromQuery] int? courseId = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] bool? inStock = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] string sortBy = "name",
            [FromQuery] string sortOrder = "asc")
        {
            // Enforce maximum page size
            pageSize = Math.Min(pageSize, MAX_PAGE_SIZE);

            // Validate price range
            if (minPrice.HasValue && maxPrice.HasValue && minPrice > maxPrice)
            {
                return BadRequest(new { message = "minPrice cannot be greater than maxPrice" });
            }

            // Build query with filters
            var query = _context.Kits
                .Include(k => k.Course)
                .AsNoTracking()
                .AsQueryable();

            // Apply filters
            if (courseId.HasValue)
            {
                query = query.Where(k => k.CourseId == courseId.Value);
            }

            if (minPrice.HasValue)
            {
                query = query.Where(k => k.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(k => k.Price <= maxPrice.Value);
            }

            if (inStock.HasValue && inStock.Value)
            {
                query = query.Where(k => k.StockQuantity > 0);
            }

            if (isActive.HasValue)
            {
                query = query.Where(k => k.IsActive == isActive.Value);
            }

            // Apply sorting
            var validSortBy = new[] { "name", "price_low", "price_high", "newest" };
            var sortByLower = sortBy?.ToLower() ?? "name";
            if (!validSortBy.Contains(sortByLower))
            {
                sortByLower = "name";
            }

            query = sortByLower switch
            {
                "price_low" => query.OrderBy(k => k.Price),
                "price_high" => query.OrderByDescending(k => k.Price),
                "newest" => query.OrderByDescending(k => k.KitId),
                _ => sortOrder.ToLower() == "desc"
                    ? query.OrderByDescending(k => k.Name)
                    : query.OrderBy(k => k.Name)
            };

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PaginatedResponse<Kit>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        // GET: api/Kits
        [HttpGet("{id}")]
        public async Task<ActionResult<Kit>> GetKit(int id)
        {
            var kit = await _context.Kits
                .Include(k => k.Category)
                .Include(k => k.Course)
                .FirstOrDefaultAsync(k => k.KitId == id);

            if (kit == null)
            {
                return NotFound("Kit not found.");
            }

            return kit;
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Kit>> PostKit(Kit kit)
        {
            // Simple validation logic
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

            return CreatedAtAction("GetKit", new { id = kit.KitId }, kit);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
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
                if (!_context.Kits.Any(k => k.KitId == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return Ok("Kit updated successfully.");
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteKit(int id)
        {
            var kit = await _context.Kits.FindAsync(id);
            if (kit == null)
            {
                return NotFound("Kit not found.");
            }

            _context.Kits.Remove(kit);
            await _context.SaveChangesAsync();

            return Ok("Kit deleted.");
        }
    }
}