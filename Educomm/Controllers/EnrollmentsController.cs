using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EnrollmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EnrollmentsController(AppDbContext context)
        {
            _context = context;
        }

        //GET api
        [HttpGet("User/{userId}")]
        public async Task<ActionResult<IEnumerable<Enrollments>>> GetUserEnrollments(int userId)
        {
            return await _context.Enrollments
                .Include(e => e.Course)
                .Where(e => e.UserId == userId)
                .ToListAsync();
        }

        // POST api
        [HttpPost]
        public async Task<ActionResult<Enrollments>> EnrollUser(Enrollments enrollment)
        {
            //exiting enrollment
            var exists = await _context.Enrollments
                .AnyAsync(e => e.UserId == enrollment.UserId && e.CourseId == enrollment.CourseId);

            if (exists) return BadRequest("User is already enrolled.");

            //if no such course is there
            var courseExists = await _context.Courses.AnyAsync(c => c.CourseId == enrollment.CourseId);
            if (!courseExists) return BadRequest("Invalid CourseId.");

            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            return Ok(enrollment);
        }

        //PUT api
        [HttpPut("UpdateProgress/{id}")]
        public async Task<IActionResult> UpdateProgress(int id, [FromBody] int progress)
        {
            var enrollment = await _context.Enrollments.FindAsync(id);
            if (enrollment == null) return NotFound();

            enrollment.ProgressPercentage = progress;
            if (progress >= 100) enrollment.IsCompleted = true;

            await _context.SaveChangesAsync();
            return Ok(enrollment);
        }
    }
}