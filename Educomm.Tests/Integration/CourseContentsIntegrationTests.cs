using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Educomm.Models;

namespace Educomm.Tests.Integration
{
    public class CourseContentsIntegrationTests : IntegrationTestBase
    {
        public CourseContentsIntegrationTests(CustomWebApplicationFactory factory) : base(factory) { }

        [Fact]
        public async Task GetContent_EnrolledUser_ReturnsContent()
        {
            // Seed data
            var category = await SeedCategoryAsync("Content-Enrolled-Cat");
            var course = await SeedCourseAsync(category.CategoryId, "Content Enrolled Course");

            // Seed course content
            await WithDbContextAsync(async db =>
            {
                db.CourseContents.Add(new CourseContent
                {
                    CourseId = course.CourseId,
                    ContentType = "Video",
                    Title = "Lesson 1",
                    ContentUrl = "http://test.com/video1.mp4",
                    SequenceOrder = 1,
                    DurationSeconds = 300
                });
                await db.SaveChangesAsync();
            });

            // Register and get token
            var (token, userId) = await CreateAuthenticatedUserAsync();

            // Enroll the user
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
            var response = await Client.GetAsync($"/api/CourseContents/{course.CourseId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetContent_NotEnrolledUser_Returns403()
        {
            var category = await SeedCategoryAsync("Content-NotEnrolled-Cat");
            var course = await SeedCourseAsync(category.CategoryId, "Content Not Enrolled Course");

            // Seed content
            await WithDbContextAsync(async db =>
            {
                db.CourseContents.Add(new CourseContent
                {
                    CourseId = course.CourseId,
                    ContentType = "Video",
                    Title = "Lesson 1",
                    ContentUrl = "http://test.com/video.mp4",
                    SequenceOrder = 1,
                    DurationSeconds = 300
                });
                await db.SaveChangesAsync();
            });

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync($"/api/CourseContents/{course.CourseId}");

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task GetContent_AdminOverride_ReturnsContent()
        {
            var category = await SeedCategoryAsync("Content-Admin-Cat");
            var course = await SeedCourseAsync(category.CategoryId, "Content Admin Course");

            await WithDbContextAsync(async db =>
            {
                db.CourseContents.Add(new CourseContent
                {
                    CourseId = course.CourseId,
                    ContentType = "Video",
                    Title = "Admin Lesson",
                    ContentUrl = "http://test.com/admin.mp4",
                    SequenceOrder = 1,
                    DurationSeconds = 600
                });
                await db.SaveChangesAsync();
            });

            // Admin user - NOT enrolled, but should still have access
            var (token, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(token);

            var response = await Client.GetAsync($"/api/CourseContents/{course.CourseId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetContent_NonExistentCourse_ReturnsNotFound()
        {
            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/CourseContents/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task PostContent_AsAdmin_ReturnsOk()
        {
            var category = await SeedCategoryAsync("Content-Post-Cat");
            var course = await SeedCourseAsync(category.CategoryId, "Content Post Course");

            var (token, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(token);

            var payload = new
            {
                CourseId = course.CourseId,
                ContentType = "Video",
                Title = "New Lesson",
                ContentUrl = "http://test.com/new.mp4",
                SequenceOrder = 1,
                DurationSeconds = 120
            };

            var response = await Client.PostAsJsonAsync("/api/CourseContents", payload);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task PostContent_InvalidCourseId_ReturnsBadRequest()
        {
            var (token, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(token);

            var payload = new
            {
                CourseId = 99999,
                ContentType = "Video",
                Title = "Bad Course Content",
                ContentUrl = "http://test.com/bad.mp4",
                SequenceOrder = 1,
                DurationSeconds = 60
            };

            var response = await Client.PostAsJsonAsync("/api/CourseContents", payload);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task GetContent_EnrolledButNoContent_ReturnsOkMessage()
        {
            var category = await SeedCategoryAsync("Empty-Content-Cat");
            var course = await SeedCourseAsync(category.CategoryId, "Empty Course");

            var (token, userId) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            // Enroll user
            await WithDbContextAsync(async context =>
            {
                context.Enrollments.Add(new Educomm.Models.Enrollments
                {
                    UserId = userId,
                    CourseId = course.CourseId,
                    EnrolledAt = DateTime.UtcNow,
                    ProgressPercentage = 0,
                    IsCompleted = false
                });
                await context.SaveChangesAsync();
            });

            // Don't add any course content

            var response = await Client.GetAsync($"/api/CourseContents/{course.CourseId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("enrolled", content.ToLower());
            Assert.Contains("no content", content.ToLower());
        }
    }
}

