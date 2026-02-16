using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;
using Microsoft.AspNetCore.Authorization;

namespace Educomm.Controllers
{
    [Route("api/progress")]
    [ApiController]
    [Authorize]
    public class CourseProgressController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CourseProgressController(AppDbContext context)
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

        // POST /api/progress/complete
        [HttpPost("complete")]
        public async Task<IActionResult> MarkContentComplete([FromBody] CompleteContentRequest request)
        {
            if (request == null || request.EnrollmentId <= 0 || request.CourseContentId <= 0)
            {
                return BadRequest("Invalid request data.");
            }

            // Verify enrollment exists and belongs to the user
            var enrollment = await _context.Enrollments
                .Include(e => e.Course)
                .FirstOrDefaultAsync(e => e.EnrollmentId == request.EnrollmentId);

            if (enrollment == null)
            {
                return NotFound("Enrollment not found.");
            }

            var userId = GetUserId();
            if (enrollment.UserId != userId)
            {
                return Forbid();
            }

            // Verify course content exists and belongs to the course
            var courseContent = await _context.CourseContents
                .FirstOrDefaultAsync(cc => cc.ContentId == request.CourseContentId && cc.CourseId == enrollment.CourseId);

            if (courseContent == null)
            {
                return NotFound("Course content not found for this enrollment's course.");
            }

            // Check if already completed
            var existingProgress = await _context.CourseContentProgress
                .FirstOrDefaultAsync(p => p.EnrollmentId == request.EnrollmentId && p.CourseContentId == request.CourseContentId);

            if (existingProgress != null)
            {
                if (existingProgress.IsCompleted)
                {
                    return Ok(new { message = "Content already marked as completed.", progress = existingProgress });
                }

                // Update existing record
                existingProgress.IsCompleted = true;
                existingProgress.CompletedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new progress record
                var newProgress = new CourseContentProgress
                {
                    EnrollmentId = request.EnrollmentId,
                    CourseContentId = request.CourseContentId,
                    IsCompleted = true,
                    CompletedAt = DateTime.UtcNow
                };
                _context.CourseContentProgress.Add(newProgress);
            }

            await _context.SaveChangesAsync();

            // Recalculate enrollment progress
            var totalModules = await _context.CourseContents
                .CountAsync(cc => cc.CourseId == enrollment.CourseId);

            var completedModules = await _context.CourseContentProgress
                .Where(p => p.EnrollmentId == request.EnrollmentId && p.IsCompleted)
                .CountAsync();

            var progressPercentage = totalModules > 0 ? (int)Math.Round((double)completedModules / totalModules * 100) : 0;

            enrollment.ProgressPercentage = progressPercentage;

            // If all modules completed, mark enrollment as completed
            if (completedModules >= totalModules && totalModules > 0)
            {
                enrollment.IsCompleted = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Content marked as completed successfully.",
                progressPercentage = progressPercentage,
                completedModules = completedModules,
                totalModules = totalModules,
                isEnrollmentCompleted = enrollment.IsCompleted
            });
        }

        // GET /api/progress/{enrollmentId}
        [HttpGet("{enrollmentId}")]
        public async Task<IActionResult> GetEnrollmentProgress(int enrollmentId)
        {
            // Verify enrollment exists and belongs to the user
            var enrollment = await _context.Enrollments
                .Include(e => e.Course)
                .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId);

            if (enrollment == null)
            {
                return NotFound("Enrollment not found.");
            }

            var userId = GetUserId();
            if (enrollment.UserId != userId)
            {
                return Forbid();
            }

            // Get all course contents for this course
            var courseContents = await _context.CourseContents
                .Where(cc => cc.CourseId == enrollment.CourseId)
                .OrderBy(cc => cc.SequenceOrder)
                .ToListAsync();

            // Get all progress records for this enrollment
            var progressRecords = await _context.CourseContentProgress
                .Where(p => p.EnrollmentId == enrollmentId)
                .ToListAsync();

            var progressDict = progressRecords.ToDictionary(p => p.CourseContentId, p => p);

            var contentDetails = courseContents.Select(cc => new
            {
                courseContentId = cc.ContentId,
                title = cc.Title,
                orderIndex = cc.SequenceOrder,
                contentType = cc.ContentType,
                isCompleted = progressDict.ContainsKey(cc.ContentId) && progressDict[cc.ContentId].IsCompleted,
                completedAt = progressDict.ContainsKey(cc.ContentId) ? progressDict[cc.ContentId].CompletedAt : null
            }).ToList();

            var totalModules = courseContents.Count;
            var completedModules = progressRecords.Count(p => p.IsCompleted);
            var progressPercentage = totalModules > 0 ? (int)Math.Round((double)completedModules / totalModules * 100) : 0;

            return Ok(new
            {
                enrollmentId = enrollmentId,
                courseId = enrollment.CourseId,
                courseName = enrollment.Course?.Name,
                contentDetails = contentDetails,
                summary = new
                {
                    totalModules = totalModules,
                    completedModules = completedModules,
                    progressPercentage = progressPercentage
                }
            });
        }
    }

    public class CompleteContentRequest
    {
        public int EnrollmentId { get; set; }
        public int CourseContentId { get; set; }
    }
}
