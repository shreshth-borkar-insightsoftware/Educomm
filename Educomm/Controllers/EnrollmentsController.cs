using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;
using Microsoft.AspNetCore.Authorization; // Security
using System.Security.Claims; // To read Token

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Locked
    public class EnrollmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EnrollmentsController(AppDbContext context)
        {
            _context = context;
        }

        // Helper to get ID from Token
        private int GetUserId()
        {
            var idClaim = User.FindFirst("UserId");
            if (idClaim == null) return 0;
            return int.Parse(idClaim.Value);
        }

        // GET api
        // CHANGED: No parameter. Shows "My Enrollments" only.
        [HttpGet("MyEnrollments")]
        public async Task<ActionResult<IEnumerable<Enrollments>>> GetMyEnrollments()
        {
            int userId = GetUserId(); // Securely get ID

            return await _context.Enrollments
                .Include(e => e.Course)
                .Where(e => e.UserId == userId)
                .ToListAsync();
        }

        // POST api
        // RESTRICTED: Admin Only. 
        // (Normal users enroll automatically when they pay in OrdersController)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Enrollments>> EnrollUser(Enrollments enrollment)
        {
            // exiting enrollment
            var exists = await _context.Enrollments
                .AnyAsync(e => e.UserId == enrollment.UserId && e.CourseId == enrollment.CourseId);

            if (exists) return BadRequest("User is already enrolled.");

            // if no such course is there
            var courseExists = await _context.Courses.AnyAsync(c => c.CourseId == enrollment.CourseId);
            if (!courseExists) return BadRequest("Invalid CourseId.");

            // if everything is fine to add a course
            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            return Ok(enrollment);
        }
    }
}