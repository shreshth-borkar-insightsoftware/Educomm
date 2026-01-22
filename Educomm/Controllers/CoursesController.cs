using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

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

        // Helper to get ID from Token (Keeps code clean)
        private int GetUserId()
        {
            var idClaim = User.FindFirst("UserId");
            if (idClaim == null) return 0;
            return int.Parse(idClaim.Value);
        }

        // GET: List all courses
        // Public to all logged in users so they can see what to buy
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Course>>> GetCourses()
        {
            return await _context.Courses
                .Include(c => c.Category)
                .ToListAsync();
        }

        // GET: The Course Player
        [HttpGet("{courseId}/Content")]
        public async Task<ActionResult> GetCourseContent(int courseId)
        {
            // SECURE: Get ID from the token, not the URL
            int userId = GetUserId();

            var course = await _context.Courses.FindAsync(courseId);
            if (course == null)
            {
                return NotFound("Course not found.");
            }

            // the protector
            // check if this specific user bought this specific course
            var isEnrolled = await _context.Enrollments
                .AnyAsync(e => e.CourseId == courseId && e.UserId == userId);

            // Admin Override: If you want Admin to watch without buying, uncomment this:
            // if (User.IsInRole("Admin")) isEnrolled = true;

            if (!isEnrolled)
            {
                //SAD Rejection
                return StatusCode(403, "Access Denied because you poor. dont be sneaky buy course.");
            }

            //coursecontents table and grab everything of this course
            var contentList = await _context.CourseContents
                .Where(c => c.CourseId == courseId)
                .OrderBy(c => c.SequenceOrder) //chapter 1 comes before 2
                .Select(c => new
                {
                    c.Title,
                    c.ContentType,
                    c.ContentUrl,
                })
                .ToListAsync();

            return Ok(new
            {
                CourseName = course.Name,
                Message = "less go now do the course",
                Materials = contentList // actual db material
            });
        }

        // POST api only Admin
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

        // DELETE: Remove Course
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