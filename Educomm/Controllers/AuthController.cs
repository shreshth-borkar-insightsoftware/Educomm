using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Educomm.Data;
using Educomm.Models;
using Educomm.Models.DTOs;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.IdentityModel.Tokens.Jwt;

namespace Educomm.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        //REGISTER
        [HttpPost("Register")]
        public async Task<ActionResult<User>> Register(User user)
        {
            //check if email exists
            if (_context.Users.Any(u => u.Email == user.Email))
            {
                return BadRequest("User already exists.");
            }

            //hash the password
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
            user.PasswordHash = passwordHash;

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(user);
        }

        //LOGIN
        [HttpPost("Login")]
        public async Task<ActionResult<object>> Login(LoginDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null) return BadRequest("User not found.");

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return BadRequest("Wrong password.");
            }
            string token = CreateToken(user);
            return Ok(new
            {
                Token = token,
                User = new
                {
                    userId = user.UserId,
                    email = user.Email,
                    role = user.Role,
                    firstName = user.FirstName,
                    lastName = user.LastName
                }
            });
        }
        //token creation method
        private string CreateToken(User user)
        {
            List<Claim> claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("UserId", user.UserId.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration.GetSection("Jwt:Key").Value!));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var token = new JwtSecurityToken(
                    claims: claims,
                    expires: DateTime.Now.AddDays(15),
                    signingCredentials: creds
                );

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);
            return jwt;
        }
    }
}