using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;
using Educomm.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EnrollmentsController : ControllerBase
    {
        private const int MAX_PAGE_SIZE = 100;
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
        [HttpGet("MyEnrollments")]
        public async Task<ActionResult<PaginatedResponse<EnrollmentDto>>> GetMyEnrollments([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            // Enforce maximum page size
            pageSize = Math.Min(pageSize, MAX_PAGE_SIZE);

            int userId = GetUserId(); // Securely get ID

            var query = _context.Enrollments
                .Include(e => e.Course)
                .Where(e => e.UserId == userId);

            var totalCount = await query.CountAsync();
            var enrollments = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Get all enrollment IDs to fetch progress in one query
            var enrollmentIds = enrollments.Select(e => e.EnrollmentId).ToList();
            var courseIds = enrollments.Select(e => e.CourseId).Distinct().ToList();

            // Fetch all module counts for these courses in one query
            var moduleCounts = await _context.CourseContents
                .Where(cc => courseIds.Contains(cc.CourseId))
                .GroupBy(cc => cc.CourseId)
                .Select(g => new { CourseId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CourseId, x => x.Count);

            // Fetch all completed module counts for these enrollments in one query
            var completedCounts = await _context.CourseContentProgress
                .Where(p => enrollmentIds.Contains(p.EnrollmentId) && p.IsCompleted)
                .GroupBy(p => p.EnrollmentId)
                .Select(g => new { EnrollmentId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.EnrollmentId, x => x.Count);

            // Map to DTOs with pre-fetched data
            var enrichedItems = enrollments.Select(enrollment => new EnrollmentDto
            {
                EnrollmentId = enrollment.EnrollmentId,
                UserId = enrollment.UserId,
                CourseId = enrollment.CourseId,
                CourseName = enrollment.Course?.Name,
                EnrolledAt = enrollment.EnrolledAt,
                IsCompleted = enrollment.IsCompleted,
                ProgressPercentage = enrollment.ProgressPercentage,
                TotalModules = moduleCounts.GetValueOrDefault(enrollment.CourseId, 0),
                CompletedModules = completedCounts.GetValueOrDefault(enrollment.EnrollmentId, 0)
            }).ToList();

            return new PaginatedResponse<EnrollmentDto>
            {
                Items = enrichedItems,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        // POST api
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

        // GET api: Get All Enrollments (Admin)
        [HttpGet("Admin/AllEnrollments")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PaginatedResponse<Enrollments>>> GetAllEnrollments([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            // Enforce maximum page size
            pageSize = Math.Min(pageSize, MAX_PAGE_SIZE);

            var query = _context.Enrollments
                .Include(e => e.Course)
                .Include(e => e.User);

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PaginatedResponse<Enrollments>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        // DELETE api: Delete Enrollment (Admin)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteEnrollment(int id)
        {
            var enrollment = await _context.Enrollments.FindAsync(id);

            if (enrollment == null)
            {
                return NotFound("Enrollment not found.");
            }

            _context.Enrollments.Remove(enrollment);
            await _context.SaveChangesAsync();

            return Ok("Enrollment deleted successfully.");
        }
    }
}