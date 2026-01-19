using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CoursesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CoursesController(AppDbContext context)
        {
            _context = context;
        }

        //GET api
        // GET api/Courses/10/Content?userId=5
        // This is the "Protected" endpoint that checks for enrollment
        [HttpGet("{courseId}/Content")]
        public async Task<ActionResult<string>> GetCourseContent(int courseId, [FromQuery] int userId)
        {
            // 1. Check if the course exists
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null)
            {
                return NotFound("Course not found.");
            }

            // 2. THE GATEKEEPER: Check if the user is enrolled
            var isEnrolled = await _context.Enrollments
                .AnyAsync(e => e.CourseId == courseId && e.UserId == userId);

            if (!isEnrolled)
            {
                // 3. Rejection: Stop them right here if they haven't bought the kit
                return StatusCode(403, "Access Denied. You must purchase the Kit to view this course.");
            }

            // 4. Success: If they passed the check, give them the content
            // (In a real app, this would be a video URL or file)
            return Ok(new
            {
                CourseName = course.Name,
                SecretContent = "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // The "Video"
                Message = "Welcome to the class! Here is your study material."
            });
        }

        //POSt api
        [HttpPost]
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
    }
}