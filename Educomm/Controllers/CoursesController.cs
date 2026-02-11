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
        private readonly AppDbContext _context;

        public CoursesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResponse<Course>>> GetCourses([FromQuery] int page = 1, [FromQuery] int pageSize = 12)
        {
            var query = _context.Courses
                .Include(c => c.Category)
                .Include(c => c.Kits);

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