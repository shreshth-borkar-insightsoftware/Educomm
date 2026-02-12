using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Educomm.Tests.Helpers
{
    public static class TestControllerContext
    {
        public static void SetUser(ControllerBase controller, int userId, string role = "User", string email = "user@example.com")
        {
            var claims = new List<Claim>
            {
                new Claim("UserId", userId.ToString()),
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.Name, email)
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = principal
                }
            };
        }
    }
}
