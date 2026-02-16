using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Educomm.Tests.Integration
{
    public class CoursesIntegrationTests : IntegrationTestBase
    {
        public CoursesIntegrationTests(CustomWebApplicationFactory factory) : base(factory) { }

        [Fact]
        public async Task GetCourses_Authenticated_ReturnsPaginatedList()
        {
            var category = await SeedCategoryAsync("Courses-Get-Cat");
            await SeedCourseAsync(category.CategoryId, "Course Alpha");
            await SeedCourseAsync(category.CategoryId, "Course Beta");

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Courses?page=1&pageSize=10");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            Assert.True(result.GetProperty("totalCount").GetInt32() >= 2);
        }

        [Fact]
        public async Task GetCourses_Unauthenticated_Returns401()
        {
            ClearAuthToken();
            var response = await Client.GetAsync("/api/Courses");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetCourse_ExistingId_ReturnsCourse()
        {
            var category = await SeedCategoryAsync("Courses-GetById-Cat");
            var course = await SeedCourseAsync(category.CategoryId, "Course GetById");

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync($"/api/Courses/{course.CourseId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            Assert.Equal("Course GetById", result.GetProperty("name").GetString());
        }

        [Fact]
        public async Task GetCourse_NonExistentId_ReturnsNotFound()
        {
            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Courses/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task PostCourse_AsAdmin_ReturnsOk()
        {
            var category = await SeedCategoryAsync("Courses-Post-Cat");
            var (token, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(token);

            var payload = new
            {
                CategoryId = category.CategoryId,
                Name = "Admin Created Course",
                Description = "Desc",
                Difficulty = "Intermediate",
                DurationMinutes = 90,
                ThumbnailUrl = "http://test.com/thumb.jpg",
                IsActive = true
            };

            var response = await Client.PostAsJsonAsync("/api/Courses", payload);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            Assert.Equal("Admin Created Course", result.GetProperty("name").GetString());
        }

        [Fact]
        public async Task PostCourse_AsCustomer_ReturnsForbidden()
        {
            var category = await SeedCategoryAsync("Courses-PostForbid-Cat");
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);

            var payload = new
            {
                CategoryId = category.CategoryId,
                Name = "Customer Course",
                Description = "Desc",
                Difficulty = "Beginner",
                DurationMinutes = 30,
                ThumbnailUrl = "http://test.com/thumb.jpg",
                IsActive = true
            };

            var response = await Client.PostAsJsonAsync("/api/Courses", payload);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task PostCourse_InvalidCategory_ReturnsBadRequest()
        {
            var (token, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(token);

            var payload = new
            {
                CategoryId = 99999,
                Name = "Bad Category Course",
                Description = "Desc",
                Difficulty = "Beginner",
                DurationMinutes = 30,
                ThumbnailUrl = "http://test.com/thumb.jpg",
                IsActive = true
            };

            var response = await Client.PostAsJsonAsync("/api/Courses", payload);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task DeleteCourse_AsAdmin_ReturnsOk()
        {
            var category = await SeedCategoryAsync("Courses-Delete-Cat");
            var course = await SeedCourseAsync(category.CategoryId, "Course To Delete");

            var (token, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(token);

            var response = await Client.DeleteAsync($"/api/Courses/{course.CourseId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task DeleteCourse_NonExistent_ReturnsNotFound()
        {
            var (token, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(token);

            var response = await Client.DeleteAsync("/api/Courses/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetCourses_WithCategoryIdFilter_ReturnsFilteredCourses()
        {
            var cat1 = await SeedCategoryAsync("Tech");
            var cat2 = await SeedCategoryAsync("Science");
            await SeedCourseAsync(cat1.CategoryId, "Tech Course");
            await SeedCourseAsync(cat2.CategoryId, "Science Course");

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync($"/api/Courses?categoryId={cat1.CategoryId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var items = result.GetProperty("items");
            Assert.Single(items.EnumerateArray());
        }

        [Fact]
        public async Task GetCourses_WithDifficultyFilter_ReturnsFilteredCourses()
        {
            var category = await SeedCategoryAsync("Difficulty-Cat");
            
            await WithDbContextAsync(async context =>
            {
                context.Courses.Add(new Educomm.Models.Course
                {
                    Name = "Beginner Course",
                    Description = "Test course description",
                    CategoryId = category.CategoryId,
                    Difficulty = "Beginner",
                    DurationMinutes = 60,
                    ThumbnailUrl = "http://test.com/thumb.jpg",
                    IsActive = true
                });
                context.Courses.Add(new Educomm.Models.Course
                {
                    Name = "Advanced Course",
                    Description = "Test course description",
                    CategoryId = category.CategoryId,
                    Difficulty = "Advanced",
                    DurationMinutes = 120,
                    ThumbnailUrl = "http://test.com/thumb.jpg",
                    IsActive = true
                });
                await context.SaveChangesAsync();
            });

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Courses?difficulty=Beginner");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var items = result.GetProperty("items");
            foreach (var item in items.EnumerateArray())
            {
                Assert.Equal("Beginner", item.GetProperty("difficulty").GetString());
            }
        }

        [Fact]
        public async Task GetCourses_WithMinDurationFilter_ReturnsFilteredCourses()
        {
            var category = await SeedCategoryAsync("Duration-Cat");
            
            await WithDbContextAsync(async context =>
            {
                context.Courses.Add(new Educomm.Models.Course
                {
                    Name = "Short Course",
                    Description = "Test course description",
                    CategoryId = category.CategoryId,
                    Difficulty = "Beginner",
                    DurationMinutes = 30,
                    ThumbnailUrl = "http://test.com/thumb.jpg",
                    IsActive = true
                });
                context.Courses.Add(new Educomm.Models.Course
                {
                    Name = "Long Course",
                    Description = "Test course description",
                    CategoryId = category.CategoryId,
                    Difficulty = "Beginner",
                    DurationMinutes = 180,
                    ThumbnailUrl = "http://test.com/thumb.jpg",
                    IsActive = true
                });
                await context.SaveChangesAsync();
            });

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Courses?minDuration=100");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var items = result.GetProperty("items");
            foreach (var item in items.EnumerateArray())
            {
                Assert.True(item.GetProperty("durationMinutes").GetInt32() >= 100);
            }
        }

        [Fact]
        public async Task GetCourses_WithMaxDurationFilter_ReturnsFilteredCourses()
        {
            var category = await SeedCategoryAsync("MaxDuration-Cat");
            
            await WithDbContextAsync(async context =>
            {
                context.Courses.Add(new Educomm.Models.Course
                {
                    Name = "Short Course",
                    Description = "Test course description",
                    CategoryId = category.CategoryId,
                    Difficulty = "Beginner",
                    DurationMinutes = 30,
                    ThumbnailUrl = "http://test.com/thumb.jpg",
                    IsActive = true
                });
                context.Courses.Add(new Educomm.Models.Course
                {
                    Name = "Long Course",
                    Description = "Test course description",
                    CategoryId = category.CategoryId,
                    Difficulty = "Beginner",
                    DurationMinutes = 180,
                    ThumbnailUrl = "http://test.com/thumb.jpg",
                    IsActive = true
                });
                await context.SaveChangesAsync();
            });

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Courses?maxDuration=100");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var items = result.GetProperty("items");
            foreach (var item in items.EnumerateArray())
            {
                Assert.True(item.GetProperty("durationMinutes").GetInt32() <= 100);
            }
        }

        [Fact]
        public async Task GetCourses_WithIsActiveFilter_ReturnsOnlyActiveCourses()
        {
            var category = await SeedCategoryAsync("Active-Cat");
            
            await WithDbContextAsync(async context =>
            {
                context.Courses.Add(new Educomm.Models.Course
                {
                    Name = "Active Course",
                    Description = "Test course description",
                    CategoryId = category.CategoryId,
                    Difficulty = "Beginner",
                    DurationMinutes = 60,
                    ThumbnailUrl = "http://test.com/thumb.jpg",
                    IsActive = true
                });
                context.Courses.Add(new Educomm.Models.Course
                {
                    Name = "Inactive Course",
                    Description = "Test course description",
                    CategoryId = category.CategoryId,
                    Difficulty = "Beginner",
                    DurationMinutes = 60,
                    ThumbnailUrl = "http://test.com/thumb.jpg",
                    IsActive = false
                });
                await context.SaveChangesAsync();
            });

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Courses?isActive=true");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var items = result.GetProperty("items");
            foreach (var item in items.EnumerateArray())
            {
                Assert.True(item.GetProperty("isActive").GetBoolean());
            }
        }

        [Fact]
        public async Task GetCourses_SortByDurationAsc_ReturnsSortedAscending()
        {
            var category = await SeedCategoryAsync("SortDur-Cat");
            
            await WithDbContextAsync(async context =>
            {
                context.Courses.Add(new Educomm.Models.Course
                {
                    Name = "Long",
                    Description = "Test course description",
                    CategoryId = category.CategoryId,
                    Difficulty = "Beginner",
                    DurationMinutes = 180,
                    ThumbnailUrl = "http://test.com/thumb.jpg",
                    IsActive = true
                });
                context.Courses.Add(new Educomm.Models.Course
                {
                    Name = "Short",
                    Description = "Test course description",
                    CategoryId = category.CategoryId,
                    Difficulty = "Beginner",
                    DurationMinutes = 30,
                    ThumbnailUrl = "http://test.com/thumb.jpg",
                    IsActive = true
                });
                await context.SaveChangesAsync();
            });

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Courses?sortBy=duration&sortOrder=asc");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var items = result.GetProperty("items").EnumerateArray().ToList();
            
            for (int i = 0; i < items.Count - 1; i++)
            {
                var current = items[i].GetProperty("durationMinutes").GetInt32();
                var next = items[i + 1].GetProperty("durationMinutes").GetInt32();
                Assert.True(current <= next);
            }
        }

        [Fact]
        public async Task GetCourses_SortByDurationDesc_ReturnsSortedDescending()
        {
            var category = await SeedCategoryAsync("SortDurDesc-Cat");
            
            await WithDbContextAsync(async context =>
            {
                context.Courses.Add(new Educomm.Models.Course
                {
                    Name = "Short",
                    Description = "Test course description",
                    CategoryId = category.CategoryId,
                    Difficulty = "Beginner",
                    DurationMinutes = 30,
                    ThumbnailUrl = "http://test.com/thumb.jpg",
                    IsActive = true
                });
                context.Courses.Add(new Educomm.Models.Course
                {
                    Name = "Long",
                    Description = "Test course description",
                    CategoryId = category.CategoryId,
                    Difficulty = "Beginner",
                    DurationMinutes = 180,
                    ThumbnailUrl = "http://test.com/thumb.jpg",
                    IsActive = true
                });
                await context.SaveChangesAsync();
            });

            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Courses?sortBy=duration&sortOrder=desc");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var items = result.GetProperty("items").EnumerateArray().ToList();
            
            for (int i = 0; i < items.Count - 1; i++)
            {
                var current = items[i].GetProperty("durationMinutes").GetInt32();
                var next = items[i + 1].GetProperty("durationMinutes").GetInt32();
                Assert.True(current >= next);
            }
        }

        [Fact]
        public async Task GetCourses_MinDurationGreaterThanMaxDuration_ReturnsBadRequest()
        {
            var (token, _) = await CreateAuthenticatedUserAsync();
            SetAuthToken(token);

            var response = await Client.GetAsync("/api/Courses?minDuration=200&maxDuration=100");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task UpdateCourse_AsAdmin_ReturnsOk()
        {
            var category = await SeedCategoryAsync("Update-Cat");
            var course = await SeedCourseAsync(category.CategoryId, "Old Name");

            var (token, _) = await CreateAuthenticatedUserAsync("Admin");
            SetAuthToken(token);

            var updatedCourse = new
            {
                courseId = course.CourseId,
                name = "Updated Name",
                description = "Updated description",
                categoryId = category.CategoryId,
                difficulty = "Intermediate",
                durationMinutes = 90,
                thumbnailUrl = "http://test.com/updated.jpg",
                isActive = true
            };

            var response = await Client.PutAsJsonAsync($"/api/Courses/{course.CourseId}", updatedCourse);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
    }
}
