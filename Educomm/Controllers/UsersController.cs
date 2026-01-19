using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;
using Educomm.Dtos;  // ← New using

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        //GET api
        [HttpGet]
        public async Task<ActionResult<List<UserResponseDto>>> GetUsers()
        {
            var users = await _context.Users.ToListAsync();

            // Map entities to DTOs
            var response = users.Select(u => new UserResponseDto
            {
                UserId = u.UserId,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                PhoneNumber = u.PhoneNumber,
                Role = u.Role,
                IsEmailVerified = u.IsEmailVerified,
                IsActive = u.IsActive
            }).ToList();

            return Ok(response);
        }

        //POST api
        [HttpPost]
        public async Task<ActionResult<UserResponseDto>> PostUser(UserCreateDto dto)
        {
            // Map DTO to entity
            var user = new User
            {
                Email = dto.Email,
                PasswordHash = dto.Password,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                PhoneNumber = dto.PhoneNumber,
                Role = "Customer",
                IsEmailVerified = false,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var response = new UserResponseDto
            {
                UserId = user.UserId,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                IsEmailVerified = user.IsEmailVerified,
                IsActive = user.IsActive
            };

            return Ok(response);
        }
    }
}
