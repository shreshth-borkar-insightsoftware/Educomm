using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;
using Microsoft.AspNetCore.Authorization; // Security

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")] // <--- LOCK THE WHOLE FILE. Only Admins manage content.
    public class CourseContentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CourseContentsController(AppDbContext context)
        {
            _context = context;
        }

        // GET api
        // Admin sees all content to manage it
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseContent>>> GetCourseContents()
        {
            return await _context.CourseContents
                .Include(c => c.Course)
                .OrderBy(c => c.CourseId)
                .ThenBy(c => c.SequenceOrder)
                .ToListAsync();
        }

        // POST api
        // Admin uploads new videos
        [HttpPost]
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