using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CourseContentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CourseContentsController(AppDbContext context)
        {
            _context = context;
        }

        //GET api
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseContent>>> GetCourseContents()
        {
            return await _context.CourseContents
                .Include(c => c.Course)
                .OrderBy(c => c.CourseId)
                .ThenBy(c => c.SequenceOrder)
                .ToListAsync();
        }

        //POST api
        [HttpPost]
        public async Task<ActionResult<CourseContent>> PostCourseContent(CourseContent content)
        {
            //Validate that the Course actually exists
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