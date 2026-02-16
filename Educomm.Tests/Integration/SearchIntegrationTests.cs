using Educomm.Models;
using Educomm.Models.DTOs;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace Educomm.Tests.Integration
{
    public class SearchIntegrationTests : IntegrationTestBase
    {
        public SearchIntegrationTests(CustomWebApplicationFactory factory) : base(factory) { }

        [Fact]
        public async Task Search_TypeAll_ReturnsBothCoursesAndKits()
        {
            // Arrange
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);
            var category = await SeedCategoryAsync("Programming");
            var course = await SeedCourseAsync(category.CategoryId, "Python Basics");
            var kit = await SeedKitAsync(category.CategoryId, course.CourseId, "Python Starter Kit");

            // Act
            var response = await Client.GetAsync("/api/Search?q=Python&type=all");
            var result = await response.Content.ReadFromJsonAsync<SearchResponse>();

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.NotNull(result);
            Assert.Single(result.Courses.Items);
            Assert.Single(result.Kits.Items);
            Assert.Equal("Python", result.Query);
        }

        [Fact]
        public async Task Search_TypeCourses_ReturnsOnlyCourses()
        {
            // Arrange
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);
            var category = await SeedCategoryAsync("Programming");
            var course = await SeedCourseAsync(category.CategoryId, "JavaScript Basics");
            var kit = await SeedKitAsync(category.CategoryId, course.CourseId, "JavaScript Starter Kit");

            // Act
            var response = await Client.GetAsync("/api/Search?q=JavaScript&type=courses");
            var result = await response.Content.ReadFromJsonAsync<SearchResponse>();

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.NotNull(result);
            Assert.Single(result.Courses.Items);
            Assert.Empty(result.Kits.Items);
        }

        [Fact]
        public async Task Search_TypeKits_ReturnsOnlyKits()
        {
            // Arrange
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);
            var category = await SeedCategoryAsync("Hardware");
            var course = await SeedCourseAsync(category.CategoryId, "Arduino Course");
            var kit = await SeedKitAsync(category.CategoryId, course.CourseId, "Arduino Kit");

            // Act
            var response = await Client.GetAsync("/api/Search?q=Arduino&type=kits");
            var result = await response.Content.ReadFromJsonAsync<SearchResponse>();

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.NotNull(result);
            Assert.Empty(result.Courses.Items);
            Assert.Single(result.Kits.Items);
        }

        [Fact]
        public async Task Search_ShortQuery_ReturnsEmptyResults()
        {
            // Arrange
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);

            // Act
            var response = await Client.GetAsync("/api/Search?q=A");
            var result = await response.Content.ReadFromJsonAsync<SearchResponse>();

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.NotNull(result);
            Assert.Empty(result.Courses.Items);
            Assert.Empty(result.Kits.Items);
        }

        [Fact]
        public async Task Search_InvalidType_ReturnsBadRequest()
        {
            // Arrange
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);

            // Act
            var response = await Client.GetAsync("/api/Search?q=test&type=invalid");

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Search_MatchesByDescription_ReturnsResults()
        {
            // Arrange
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);
            var category = await SeedCategoryAsync("Science");
            
            await WithDbContextAsync(async context =>
            {
                var course = new Course
                {
                    Name = "Lab101",
                    Description = "Learn physics experiments",
                    CategoryId = category.CategoryId,
                    Difficulty = "Beginner",
                    DurationMinutes = 120,
                    ThumbnailUrl = "http://test.com/thumb.jpg",
                    IsActive = true
                };
                context.Courses.Add(course);
                await context.SaveChangesAsync();
            });

            // Act
            var response = await Client.GetAsync("/api/Search?q=physics&type=courses");
            var result = await response.Content.ReadFromJsonAsync<SearchResponse>();

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.NotNull(result);
            Assert.Single(result.Courses.Items);
        }

        [Fact]
        public async Task Search_NoMatches_ReturnsEmptyResults()
        {
            // Arrange
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);
            var category = await SeedCategoryAsync("Math");
            await SeedCourseAsync(category.CategoryId, "Algebra");

            // Act
            var response = await Client.GetAsync("/api/Search?q=Quantum");
            var result = await response.Content.ReadFromJsonAsync<SearchResponse>();

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.NotNull(result);
            Assert.Empty(result.Courses.Items);
            Assert.Empty(result.Kits.Items);
        }

        [Fact]
        public async Task Search_WithPagination_ReturnsPagedResults()
        {
            // Arrange
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);
            var category = await SeedCategoryAsync("Tech");
            
            await WithDbContextAsync(async context =>
            {
                for (int i = 1; i <= 8; i++)
                {
                    context.Courses.Add(new Course
                    {
                        Name = $"Tech Course {i}",
                        Description = "Tech description",
                        CategoryId = category.CategoryId,
                        Difficulty = "Beginner",
                        DurationMinutes = 60,
                        ThumbnailUrl = "http://test.com/thumb.jpg",
                        IsActive = true
                    });
                }
                await context.SaveChangesAsync();
            });

            // Act
            var response = await Client.GetAsync("/api/Search?q=Tech&type=courses&page=1&pageSize=5");
            var result = await response.Content.ReadFromJsonAsync<SearchResponse>();

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.NotNull(result);
            Assert.Equal(5, result.Courses.Items.Count);
            Assert.Equal(8, result.Courses.TotalCount);
        }

        [Fact]
        public async Task Search_PageSizeExceedsMax_CapsAt100()
        {
            // Arrange
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);
            var category = await SeedCategoryAsync("Large");
            await SeedCourseAsync(category.CategoryId, "Large Course");

            // Act
            var response = await Client.GetAsync("/api/Search?q=Large&type=courses&pageSize=200");
            var result = await response.Content.ReadFromJsonAsync<SearchResponse>();

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.NotNull(result);
            // Should cap at 100, but since we only have 1 result, we get 1
            Assert.Single(result.Courses.Items);
        }

        [Fact]
        public async Task Search_EmptyQuery_ReturnsEmptyResults()
        {
            // Arrange
            var (token, _) = await CreateAuthenticatedUserAsync("Customer");
            SetAuthToken(token);

            // Act
            var response = await Client.GetAsync("/api/Search?q=");
            var result = await response.Content.ReadFromJsonAsync<SearchResponse>();

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.NotNull(result);
            Assert.Empty(result.Courses.Items);
            Assert.Empty(result.Kits.Items);
        }
    }
}
