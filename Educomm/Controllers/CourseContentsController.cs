using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims; // Needed to read the User ID from the token

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Locks the whole controller to logged-in users
    public class CourseContentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CourseContentsController(AppDbContext context)
        {
            _context = context;
        }

        // Helper to get the logged-in User's ID from the token
        private int GetUserId()
        {
            var idClaim = User.FindFirst("UserId"); // Make sure your token has this claim
            if (idClaim == null) return 0;
            return int.Parse(idClaim.Value);
        }

        // GET api/CourseContents/{courseId}
        // CORRECTED: Now requires a Course ID and checks for Enrollment
        [HttpGet("{courseId}")]
        public async Task<ActionResult<IEnumerable<CourseContent>>> GetContentForCourse(int courseId)
        {
            int userId = GetUserId();

            // 1. Check if the course actually exists
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) return NotFound("Course not found.");

            // 2. SECURITY CHECK: Check the Enrollment Table
            // Does a row exist connecting this User to this Course?
            bool isEnrolled = await _context.Enrollments
                .AnyAsync(e => e.CourseId == courseId && e.UserId == userId);

            // 3. Admin Override: Admins can see everything without paying
            if (User.IsInRole("Admin"))
            {
                isEnrolled = true;
            }

            // 4. If they have NOT purchased the course, block them
            if (!isEnrolled)
            {
                // This returns a 403 Forbidden status with your message
                return StatusCode(403, "Access Denied. You have not purchased this course.");
            }

            // 5. If they passed the check, return the videos for THAT course only
            var content = await _context.CourseContents
                .Where(c => c.CourseId == courseId)
                .OrderBy(c => c.SequenceOrder)
                .ToListAsync();

            if (!content.Any())
            {
                return Ok("You are enrolled, but this course has no content yet.");
            }

            return Ok(content);
        }

        // POST api (Admins only)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<CourseContent>> PostCourseContent(CourseContent content)
        {
            // Validate that the Course actually exists
            var courseExists = await _context.Courses.AnyAsync(c => c.CourseId == content.CourseId);
            if (!courseExists)
            {
                return BadRequest("Invalid CourseId. That course does not exist.");
            }

            _context.CourseContents.Add(content);
            await _context.SaveChangesAsync();

            return Ok(content);
        }
    }
}