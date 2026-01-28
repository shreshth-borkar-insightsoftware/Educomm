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
    public class CoursesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CoursesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Courses
        // Lists all courses (Name, Description, Price, Category)
        // Public info that anyone logged in can see to decide what to buy.
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Course>>> GetCourses()
        {
            return await _context.Courses
                .Include(c => c.Category) // Keep this to show Category Name
                .Include(c => c.Kits)
                .ToListAsync();
        }

        // POST: api/Courses
        // Admin Only: Create a new Course
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

        // DELETE: api/Courses/5
        // Admin Only: Delete a Course
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