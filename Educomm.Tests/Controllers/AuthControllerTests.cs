using Educomm.Controllers;
using Educomm.Models.DTOs;
using Educomm.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Educomm.Tests.Controllers
{
    public class AuthControllerTests
    {
        private static IConfiguration BuildConfig()
        {
            var settings = new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "supersecretkeysupersecretkeysupersecretkeysupersecretkeysupersecretkey"
            };

            return new ConfigurationBuilder()
                .AddInMemoryCollection(settings)
                .Build();
        }

        [Fact]
        public async Task Register_ExistingUser_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "existing@example.com"));
            await context.SaveChangesAsync();

            var controller = new AuthController(context, BuildConfig());

            var user = TestDataBuilder.CreateUser(2, "existing@example.com");
            var result = await controller.Register(user);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("User already exists.", badRequest.Value);
        }

        [Fact]
        public async Task Login_WrongPassword_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user@example.com"));
            await context.SaveChangesAsync();

            var controller = new AuthController(context, BuildConfig());

            var result = await controller.Login(new LoginDto
            {
                Email = "user@example.com",
                Password = "wrong"
            });

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Wrong password.", badRequest.Value);
        }

        [Fact]
        public async Task Login_Success_ReturnsToken()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user@example.com"));
            await context.SaveChangesAsync();

            var controller = new AuthController(context, BuildConfig());

            var result = await controller.Login(new LoginDto
            {
                Email = "user@example.com",
                Password = "P@ssw0rd"
            });

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var tokenProp = ok.Value?.GetType().GetProperty("Token");
            Assert.NotNull(tokenProp);
            var tokenValue = tokenProp?.GetValue(ok.Value)?.ToString();
            Assert.False(string.IsNullOrWhiteSpace(tokenValue));
        }

        [Fact]
        public async Task Register_Success_HashesPassword()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new AuthController(context, BuildConfig());

            var user = TestDataBuilder.CreateUser(1, "new@example.com");
            user.PasswordHash = "plain";

            var result = await controller.Register(user);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var saved = Assert.IsType<Educomm.Models.User>(ok.Value);
            Assert.NotEqual("plain", saved.PasswordHash);
        }
    }
}
