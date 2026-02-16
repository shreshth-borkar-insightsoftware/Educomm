using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Educomm.Data;
using Educomm.Models;

namespace Educomm.Tests.Integration
{
    /// <summary>
    /// Base class for integration tests providing HttpClient,
    /// authentication helpers, and data seeding utilities.
    /// </summary>
    public abstract class IntegrationTestBase : IClassFixture<CustomWebApplicationFactory>, IDisposable
    {
        protected readonly CustomWebApplicationFactory Factory;
        protected readonly HttpClient Client;

        protected static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        protected IntegrationTestBase(CustomWebApplicationFactory factory)
        {
            Factory = factory;
            Client = factory.CreateClient();
        }

        /// <summary>
        /// Registers a new user via the Auth/Register endpoint.
        /// Returns the user object from the response.
        /// </summary>
        protected async Task<JsonElement> RegisterUserAsync(
            string email, string password, string firstName, string lastName, string role = "Customer")
        {
            var payload = new
            {
                Email = email,
                PasswordHash = password,
                FirstName = firstName,
                LastName = lastName,
                PhoneNumber = "1234567890",
                Role = role
            };

            var response = await Client.PostAsJsonAsync("/api/Auth/Register", payload);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
        }

        /// <summary>
        /// Logs in with the given credentials and returns the JWT token string.
        /// </summary>
        protected async Task<string> LoginAndGetTokenAsync(string email, string password)
        {
            var payload = new { Email = email, Password = password };
            var response = await Client.PostAsJsonAsync("/api/Auth/Login", payload);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            return result.GetProperty("token").GetString()!;
        }

        /// <summary>
        /// Registers a user, logs in, and returns the token.
        /// Uses a unique email based on a GUID suffix to avoid conflicts.
        /// </summary>
        protected async Task<(string Token, int UserId)> CreateAuthenticatedUserAsync(
            string role = "Customer", string? emailPrefix = null)
        {
            var uniqueId = Guid.NewGuid().ToString("N")[..8];
            var email = $"{emailPrefix ?? role.ToLower()}_{uniqueId}@test.com";
            var password = "TestPassword123!";

            var userResult = await RegisterUserAsync(email, password, "Test", "User", role);
            var userId = userResult.GetProperty("userId").GetInt32();
            var token = await LoginAndGetTokenAsync(email, password);

            return (token, userId);
        }

        /// <summary>
        /// Sets the Authorization header on the shared HttpClient.
        /// </summary>
        protected void SetAuthToken(string token)
        {
            Client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);
        }

        /// <summary>
        /// Clears the Authorization header.
        /// </summary>
        protected void ClearAuthToken()
        {
            Client.DefaultRequestHeaders.Authorization = null;
        }

        /// <summary>
        /// Executes an action with direct database access for seeding test data.
        /// </summary>
        protected async Task WithDbContextAsync(Func<AppDbContext, Task> action)
        {
            using var scope = Factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await action(db);
        }

        /// <summary>
        /// Seeds a category into the database and returns it.
        /// </summary>
        protected async Task<Category> SeedCategoryAsync(string name = "Test Category")
        {
            Category category = null!;
            await WithDbContextAsync(async db =>
            {
                category = new Category { Name = name, Description = "Test desc", IsActive = true };
                db.Categories.Add(category);
                await db.SaveChangesAsync();
            });
            return category;
        }

        /// <summary>
        /// Seeds a course linked to the given category.
        /// </summary>
        protected async Task<Course> SeedCourseAsync(int categoryId, string name = "Test Course")
        {
            Course course = null!;
            await WithDbContextAsync(async db =>
            {
                course = new Course
                {
                    CategoryId = categoryId,
                    Name = name,
                    Description = "Test description",
                    Difficulty = "Beginner",
                    DurationMinutes = 60,
                    ThumbnailUrl = "http://test.com/thumb.jpg",
                    IsActive = true
                };
                db.Courses.Add(course);
                await db.SaveChangesAsync();
            });
            return course;
        }

        /// <summary>
        /// Seeds a kit linked to the given category and optionally a course.
        /// </summary>
        protected async Task<Kit> SeedKitAsync(int categoryId, int? courseId = null, string name = "Test Kit",
            decimal price = 99.99m, int stock = 50)
        {
            Kit kit = null!;
            await WithDbContextAsync(async db =>
            {
                kit = new Kit
                {
                    CategoryId = categoryId,
                    CourseId = courseId,
                    Name = name,
                    Description = "Test kit description",
                    SKU = $"SKU-{Guid.NewGuid().ToString("N")[..6]}",
                    Price = price,
                    StockQuantity = stock,
                    ImageUrl = "http://test.com/kit.jpg",
                    Weight = 1.5m,
                    Dimensions = "10x10x5",
                    IsActive = true
                };
                db.Kits.Add(kit);
                await db.SaveChangesAsync();
            });
            return kit;
        }

        public void Dispose()
        {
            Client?.Dispose();
        }
    }
}
