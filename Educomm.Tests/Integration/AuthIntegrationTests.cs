using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Educomm.Tests.Integration
{
    public class AuthIntegrationTests : IntegrationTestBase
    {
        public AuthIntegrationTests(CustomWebApplicationFactory factory) : base(factory) { }

        [Fact]
        public async Task Register_ValidUser_ReturnsOkWithUser()
        {
            var email = $"register_ok_{Guid.NewGuid():N}@test.com";
            var payload = new
            {
                Email = email,
                PasswordHash = "Password123!",
                FirstName = "John",
                LastName = "Doe",
                PhoneNumber = "9876543210",
                Role = "Customer"
            };

            var response = await Client.PostAsJsonAsync("/api/Auth/Register", payload);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            Assert.Equal(email, result.GetProperty("email").GetString());
        }

        [Fact]
        public async Task Register_DuplicateEmail_ReturnsBadRequest()
        {
            var email = $"dup_{Guid.NewGuid():N}@test.com";
            var payload = new
            {
                Email = email,
                PasswordHash = "Password123!",
                FirstName = "John",
                LastName = "Doe",
                PhoneNumber = "9876543210",
                Role = "Customer"
            };

            await Client.PostAsJsonAsync("/api/Auth/Register", payload);
            var response = await Client.PostAsJsonAsync("/api/Auth/Register", payload);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Login_ValidCredentials_ReturnsTokenAndUser()
        {
            var email = $"login_ok_{Guid.NewGuid():N}@test.com";
            var password = "Password123!";

            await RegisterUserAsync(email, password, "Jane", "Doe");
            var response = await Client.PostAsJsonAsync("/api/Auth/Login", new { Email = email, Password = password });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            Assert.False(string.IsNullOrEmpty(result.GetProperty("token").GetString()));
            Assert.Equal(email, result.GetProperty("user").GetProperty("email").GetString());
        }

        [Fact]
        public async Task Login_WrongPassword_ReturnsBadRequest()
        {
            var email = $"wrongpwd_{Guid.NewGuid():N}@test.com";
            await RegisterUserAsync(email, "CorrectPassword123!", "Test", "User");

            var response = await Client.PostAsJsonAsync("/api/Auth/Login", new { Email = email, Password = "WrongPassword!" });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Login_NonExistentUser_ReturnsBadRequest()
        {
            var response = await Client.PostAsJsonAsync("/api/Auth/Login",
                new { Email = "nonexistent@test.com", Password = "whatever" });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }
}
