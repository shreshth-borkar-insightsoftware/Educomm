using Educomm.Controllers;
using Educomm.Models;
using Educomm.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Educomm.Tests.Controllers
{
    public class CoursesControllerTests
    {
        [Fact]
        public async Task GetCourses_InvalidDuration_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new CoursesController(context);

            var result = await controller.GetCourses(minDuration: 10, maxDuration: 5);

            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetCourse_NotFound_ReturnsNotFound()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new CoursesController(context);

            var result = await controller.GetCourse(1234);

            Assert.IsType<NotFoundObjectResult>(result.Result);
        }

        [Fact]
        public async Task PostCourse_InvalidCategory_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new CoursesController(context);

            var course = TestDataBuilder.CreateCourse(1, categoryId: 99);
            var result = await controller.PostCourse(course);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Invalid CategoryId. That category does not exist.", badRequest.Value);
        }

        [Fact]
        public async Task PostCourse_Valid_ReturnsOk()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            await context.SaveChangesAsync();

            var controller = new CoursesController(context);

            var course = TestDataBuilder.CreateCourse(1, categoryId: 1);
            var result = await controller.PostCourse(course);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var created = Assert.IsType<Course>(ok.Value);
            Assert.Equal("Course 1", created.Name);
        }

        [Fact]
        public async Task UpdateCourse_IdMismatch_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new CoursesController(context);

            var course = TestDataBuilder.CreateCourse(1, categoryId: 1);
            var result = await controller.UpdateCourse(2, course);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("ID mismatch.", badRequest.Value);
        }

        [Fact]
        public async Task DeleteCourse_NotFound_ReturnsNotFound()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new CoursesController(context);

            var result = await controller.DeleteCourse(999);

            var notFound = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Course not found.", notFound.Value);
        }

        [Fact]
        public async Task GetCourses_FilterByCategory_ReturnsOnlyThatCategory()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.AddRange(
                TestDataBuilder.CreateCategory(1, "Cat 1"),
                TestDataBuilder.CreateCategory(2, "Cat 2"));
            context.Courses.AddRange(
                TestDataBuilder.CreateCourse(1, categoryId: 1, name: "Course A"),
                TestDataBuilder.CreateCourse(2, categoryId: 2, name: "Course B"));
            await context.SaveChangesAsync();

            var controller = new CoursesController(context);

            var result = await controller.GetCourses(categoryId: 1);

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Course>>(result.Value);
            Assert.Single(response.Items);
            Assert.Equal(1, response.Items.First().CategoryId);
        }

        [Fact]
        public async Task GetCourses_FilterByDifficultyAndDuration_ReturnsMatch()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            var course1 = TestDataBuilder.CreateCourse(1, categoryId: 1, name: "Beginner Course");
            course1.Difficulty = "Beginner";
            course1.DurationMinutes = 60;
            var course2 = TestDataBuilder.CreateCourse(2, categoryId: 1, name: "Advanced Course");
            course2.Difficulty = "Advanced";
            course2.DurationMinutes = 120;
            context.Courses.AddRange(course1, course2);
            await context.SaveChangesAsync();

            var controller = new CoursesController(context);

            var result = await controller.GetCourses(difficulty: "Beginner", minDuration: 30, maxDuration: 90);

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Course>>(result.Value);
            Assert.Single(response.Items);
            Assert.Equal("Beginner", response.Items.First().Difficulty);
        }

        [Fact]
        public async Task GetCourses_SortByDurationDesc_ReturnsDescending()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            var shortCourse = TestDataBuilder.CreateCourse(1, categoryId: 1, name: "Short");
            shortCourse.DurationMinutes = 30;
            var longCourse = TestDataBuilder.CreateCourse(2, categoryId: 1, name: "Long");
            longCourse.DurationMinutes = 120;
            context.Courses.AddRange(shortCourse, longCourse);
            await context.SaveChangesAsync();

            var controller = new CoursesController(context);

            var result = await controller.GetCourses(sortBy: "duration", sortOrder: "desc");

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Course>>(result.Value);
            Assert.Equal("Long", response.Items.First().Name);
        }

        [Fact]
        public async Task GetCourses_InvalidSortBy_FallsBackToName()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.AddRange(
                TestDataBuilder.CreateCourse(1, categoryId: 1, name: "B Course"),
                TestDataBuilder.CreateCourse(2, categoryId: 1, name: "A Course"));
            await context.SaveChangesAsync();

            var controller = new CoursesController(context);

            var result = await controller.GetCourses(sortBy: "invalid");

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Course>>(result.Value);
            Assert.Equal("A Course", response.Items.First().Name);
        }

        [Fact]
        public async Task GetCourses_Pagination_ReturnsSecondPage()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            for (var i = 1; i <= 12; i++)
            {
                context.Courses.Add(TestDataBuilder.CreateCourse(i, categoryId: 1, name: $"Course {i:00}"));
            }
            await context.SaveChangesAsync();

            var controller = new CoursesController(context);

            var result = await controller.GetCourses(page: 2, pageSize: 5);

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Course>>(result.Value);
            Assert.Equal(2, response.Page);
            Assert.Equal(5, response.Items.Count());
        }

        [Fact]
        public async Task GetCourses_PageSizeExceedsMaximum_CapsAtMaxPageSize()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            // Create 150 courses to test the limit
            for (var i = 1; i <= 150; i++)
            {
                context.Courses.Add(TestDataBuilder.CreateCourse(i, categoryId: 1, name: $"Course {i:00}"));
            }
            await context.SaveChangesAsync();

            var controller = new CoursesController(context);

            // Request 1000 items
            var result = await controller.GetCourses(page: 1, pageSize: 1000);

            var response = Assert.IsType<Educomm.Models.DTOs.PaginatedResponse<Course>>(result.Value);
            // Should only return 100 items (MAX_PAGE_SIZE)
            Assert.Equal(100, response.Items.Count());
            Assert.Equal(100, response.PageSize);
        }
    }
}
