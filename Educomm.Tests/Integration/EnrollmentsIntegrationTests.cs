using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Educomm.Models;

namespace Educomm.Tests.Integration
{
    public class EnrollmentsIntegrationTests : IntegrationTestBase
    {
        public EnrollmentsIntegrationTests(CustomWebApplicationFactory factory) : base(factory) { }

        [Fact]
        public async Task GetMyEnrollments_ReturnsUserEnrollments()
        {
            var category = await SeedCategoryAsync("Enroll-Get-Cat");
            var course = await SeedCourseAsync(category.CategoryId, "Enrollment Course");

            var (token, userId) = await CreateAuthenticatedUserAsync();

            // Enroll the user directly
            await WithDbContextAsync(async db =>
            {
                db.Enrollments.Add(new Enrollments
                {
                    UserId = userId,
                    CourseId = course.CourseId,
                    EnrolledAt = DateTime.UtcNow,
                    IsCompleted = false,
                    ProgressPercentage = 0
                });
                await db.SaveChangesAsync();
            });

            SetAuthToken(token);
            var response = await Client.GetAsync("/api/Enrollments/MyEnrollments");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            Assert.True(result.GetProperty("totalCount").GetInt32() >= 1);
        }

        [Fact]
        public async Task GetMyEnrollments_NoEnrollments_ReturnsEmptyList()
        {
            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Enrollments/MyEnrollments");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            Assert.Equal(0, result.GetProperty("totalCount").GetInt32());
        }

        [Fact]
        public async Task EnrollUser_AsAdmin_ReturnsOk()
        {
            var category = await SeedCategoryAsync("Enroll-Post-Cat");
            var course = await SeedCourseAsync(category.CategoryId, "Enroll Post Course");

            // Create a customer user to enroll
            var (_, customerId) = await CreateAuthenticatedUserAsync("Customer", "enrolltarget");

            var (adminToken, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(adminToken);

            var payload = new
            {
                UserId = customerId,
                CourseId = course.CourseId,
                EnrolledAt = DateTime.UtcNow,
                IsCompleted = false,
                ProgressPercentage = 0
            };

            var response = await Client.PostAsJsonAsync("/api/Enrollments", payload);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task EnrollUser_DuplicateEnrollment_ReturnsBadRequest()
        {
            var category = await SeedCategoryAsync("Enroll-Dup-Cat");
            var course = await SeedCourseAsync(category.CategoryId, "Enroll Dup Course");

            var (_, customerId) = await CreateAuthenticatedUserAsync("Customer", "enrolldup");

            // Pre-enroll the user
            await WithDbContextAsync(async db =>
            {
                db.Enrollments.Add(new Enrollments
                {
                    UserId = customerId,
                    CourseId = course.CourseId,
                    EnrolledAt = DateTime.UtcNow,
                    IsCompleted = false,
                    ProgressPercentage = 0
                });
                await db.SaveChangesAsync();
            });

            var (adminToken, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(adminToken);

            var payload = new
            {
                UserId = customerId,
                CourseId = course.CourseId,
                EnrolledAt = DateTime.UtcNow,
                IsCompleted = false,
                ProgressPercentage = 0
            };

            var response = await Client.PostAsJsonAsync("/api/Enrollments", payload);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task EnrollUser_InvalidCourseId_ReturnsBadRequest()
        {
            var (_, customerId) = await CreateAuthenticatedUserAsync("Customer", "enrollbadcourse");

            var (adminToken, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(adminToken);

            var payload = new
            {
                UserId = customerId,
                CourseId = 99999,
                EnrolledAt = DateTime.UtcNow,
                IsCompleted = false,
                ProgressPercentage = 0
            };

            var response = await Client.PostAsJsonAsync("/api/Enrollments", payload);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task DeleteEnrollment_AsAdmin_ReturnsOk()
        {
            var category = await SeedCategoryAsync("Enroll-Del-Cat");
            var course = await SeedCourseAsync(category.CategoryId, "Enroll Del Course");

            var (_, customerId) = await CreateAuthenticatedUserAsync("Customer", "enrolldel");

            int enrollmentId = 0;
            await WithDbContextAsync(async db =>
            {
                var enrollment = new Enrollments
                {
                    UserId = customerId,
                    CourseId = course.CourseId,
                    EnrolledAt = DateTime.UtcNow,
                    IsCompleted = false,
                    ProgressPercentage = 0
                };
                db.Enrollments.Add(enrollment);
                await db.SaveChangesAsync();
                enrollmentId = enrollment.EnrollmentId;
            });

            var (adminToken, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(adminToken);

            var response = await Client.DeleteAsync($"/api/Enrollments/{enrollmentId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task DeleteEnrollment_NonExistent_ReturnsNotFound()
        {
            var (adminToken, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(adminToken);

            var response = await Client.DeleteAsync("/api/Enrollments/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetAllEnrollments_AsAdmin_ReturnsPaginatedList()
        {
            var (adminToken, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(adminToken);

            var response = await Client.GetAsync("/api/Enrollments/Admin/AllEnrollments");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            Assert.True(result.TryGetProperty("totalCount", out _));
        }

        [Fact]
        public async Task GetAllEnrollments_AsCustomer_ReturnsForbidden()
        {
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Enrollments/Admin/AllEnrollments");

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task EnrollUser_AsCustomer_ReturnsForbidden()
        {
            var category = await SeedCategoryAsync("Enroll-Customer-Cat");
            var course = await SeedCourseAsync(category.CategoryId, "Customer Enroll Test");

            var (token, userId) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);

            var enrollment = new
            {
                UserId = userId,
                CourseId = course.CourseId,
                EnrolledAt = DateTime.UtcNow,
                ProgressPercentage = 0,
                IsCompleted = false
            };

            var response = await Client.PostAsJsonAsync("/api/Enrollments", enrollment);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }
    }
}

