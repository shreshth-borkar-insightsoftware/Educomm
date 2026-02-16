using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;
using Educomm.Models.DTOs;

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private const int MAX_PAGE_SIZE = 100;
        private readonly AppDbContext _context;

        public SearchController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<SearchResponse>> Search(
            [FromQuery] string q,
            [FromQuery] string type = "all",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5)
        {
            // Validate and sanitize query
            var query = (q ?? string.Empty).Trim();
            
            // Return empty results if query is too short
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            {
                return Ok(new SearchResponse
                {
                    Query = query,
                    Courses = new SearchResultSet(),
                    Kits = new SearchResultSet()
                });
            }

            // Cap pageSize at maximum
            pageSize = Math.Min(pageSize, MAX_PAGE_SIZE);
            
            // Sanitize query for PostgreSQL LIKE - escape special characters
            var sanitizedQuery = query
                .Replace("\\", "\\\\")
                .Replace("%", "\\%")
                .Replace("_", "\\_");
            
            // Create search pattern
            var searchPattern = $"%{sanitizedQuery}%";

            // Normalize type parameter
            type = type?.ToLower() ?? "all";

            var response = new SearchResponse
            {
                Query = query,
                Courses = new SearchResultSet(),
                Kits = new SearchResultSet()
            };

            // Execute searches based on type parameter
            if (type == "all")
            {
                // Search both courses and kits sequentially (DbContext is not thread-safe)
                response.Courses = await SearchCoursesAsync(searchPattern, page, pageSize);
                response.Kits = await SearchKitsAsync(searchPattern, page, pageSize);
            }
            else if (type == "courses")
            {
                // Search only courses
                response.Courses = await SearchCoursesAsync(searchPattern, page, pageSize);
            }
            else if (type == "kits")
            {
                // Search only kits
                response.Kits = await SearchKitsAsync(searchPattern, page, pageSize);
            }
            else
            {
                // Invalid type parameter - return empty results
                return BadRequest(new { message = "Invalid type parameter. Use 'all', 'courses', or 'kits'." });
            }

            return Ok(response);
        }

        private async Task<SearchResultSet> SearchCoursesAsync(string searchPattern, int page, int pageSize)
        {
            // Extract the raw search term from the LIKE pattern (remove surrounding %)
            var searchTerm = searchPattern.Trim('%').ToLower();

            var query = _context.Courses
                .Include(c => c.Category)
                .Include(c => c.Kits)
                .AsNoTracking()
                .Where(c => 
                    c.Name.ToLower().Contains(searchTerm) || 
                    (c.Description ?? "").ToLower().Contains(searchTerm));

            var totalCount = await query.CountAsync();
            
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new
                {
                    c.CourseId,
                    c.Name,
                    c.Description,
                    c.Difficulty,
                    c.DurationMinutes,
                    c.ThumbnailUrl,
                    c.IsActive,
                    CategoryId = c.Category != null ? c.Category.CategoryId : (int?)null,
                    CategoryName = c.Category != null ? c.Category.Name : null,
                    Kits = c.Kits.Select(k => new
                    {
                        k.KitId,
                        k.Name,
                        k.Price,
                        k.StockQuantity
                    }).ToList()
                })
                .ToListAsync();

            return new SearchResultSet
            {
                Items = items.Cast<object>().ToList(),
                TotalCount = totalCount
            };
        }

        private async Task<SearchResultSet> SearchKitsAsync(string searchPattern, int page, int pageSize)
        {
            // Extract the raw search term from the LIKE pattern (remove surrounding %)
            var searchTerm = searchPattern.Trim('%').ToLower();

            var query = _context.Kits
                .Include(k => k.Course)
                .AsNoTracking()
                .Where(k => 
                    k.Name.ToLower().Contains(searchTerm) || 
                    (k.Description ?? "").ToLower().Contains(searchTerm));

            var totalCount = await query.CountAsync();
            
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(k => new
                {
                    k.KitId,
                    k.Name,
                    k.Description,
                    k.Price,
                    k.StockQuantity,
                    k.ImageUrl,
                    k.IsActive,
                    CourseId = k.Course != null ? k.Course.CourseId : (int?)null,
                    CourseName = k.Course != null ? k.Course.Name : null
                })
                .ToListAsync();

            return new SearchResultSet
            {
                Items = items.Cast<object>().ToList(),
                TotalCount = totalCount
            };
        }
    }
}
