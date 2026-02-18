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
    public class CoursesController : ControllerBase
    {
        private const int MAX_PAGE_SIZE = 100;
        private readonly AppDbContext _context;

        public CoursesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<PaginatedResponse<Course>>> GetCourses(
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 12,
            [FromQuery] int? categoryId = null,
            [FromQuery] string? difficulty = null,
            [FromQuery] int? minDuration = null,
            [FromQuery] int? maxDuration = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] string sortBy = "name",
            [FromQuery] string sortOrder = "asc")
        {
            // Enforce maximum page size
            pageSize = Math.Min(pageSize, MAX_PAGE_SIZE);

            // Validate duration range
            if (minDuration.HasValue && maxDuration.HasValue && minDuration > maxDuration)
            {
                return BadRequest(new { message = "minDuration cannot be greater than maxDuration" });
            }

            // Build query with filters
            var query = _context.Courses
                .Include(c => c.Category)
                .Include(c => c.Kits)
                .AsNoTracking()
                .AsQueryable();

            // Apply filters
            if (categoryId.HasValue)
            {
                query = query.Where(c => c.CategoryId == categoryId.Value);
            }

            if (!string.IsNullOrWhiteSpace(difficulty))
            {
                query = query.Where(c => c.Difficulty == difficulty);
            }

            if (minDuration.HasValue)
            {
                query = query.Where(c => c.DurationMinutes >= minDuration.Value);
            }

            if (maxDuration.HasValue)
            {
                query = query.Where(c => c.DurationMinutes <= maxDuration.Value);
            }

            if (isActive.HasValue)
            {
                query = query.Where(c => c.IsActive == isActive.Value);
            }

            // Apply sorting
            var validSortBy = new[] { "name", "duration", "newest" };
            var sortByLower = sortBy?.ToLower() ?? "name";
            if (!validSortBy.Contains(sortByLower))
            {
                sortByLower = "name";
            }

            query = sortByLower switch
            {
                "duration" => sortOrder.ToLower() == "desc" 
                    ? query.OrderByDescending(c => c.DurationMinutes)
                    : query.OrderBy(c => c.DurationMinutes),
                "newest" => query.OrderByDescending(c => c.CourseId),
                _ => sortOrder.ToLower() == "desc"
                    ? query.OrderByDescending(c => c.Name)
                    : query.OrderBy(c => c.Name)
            };

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PaginatedResponse<Course>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Course>> GetCourse(int id)
        {
            var course = await _context.Courses
                .Include(c => c.Category)
                .Include(c => c.Kits)
                .Include(c => c.CourseContents)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CourseId == id);

            if (course == null)
            {
                return NotFound(new { message = "Course not found" });
            }

            return course;
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Course>> PostCourse(Course course)
        {
            var categoryExists = await _context.Categories.AnyAsync(c => c.CategoryId == course.CategoryId);

            if (!categoryExists)
            {
                return BadRequest("Invalid CategoryId. That category does not exist.");
            }

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            return Ok(course);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCourse(int id, Course course)
        {
            if (id != course.CourseId)
            {
                return BadRequest("ID mismatch.");
            }

            var categoryExists = await _context.Categories.AnyAsync(c => c.CategoryId == course.CategoryId);
            if (!categoryExists)
            {
                return BadRequest("Invalid CategoryId. That category does not exist.");
            }

            _context.Entry(course).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Courses.Any(c => c.CourseId == id))
                {
                    return NotFound("Course not found.");
                }
                else
                {
                    throw;
                }
            }

            return Ok("Course updated successfully.");
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound("Course not found.");

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();

            return Ok("Course deleted.");
        }
    }
}