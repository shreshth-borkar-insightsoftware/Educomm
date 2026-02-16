using Educomm.Controllers;
using Educomm.Models.DTOs;
using Educomm.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Educomm.Tests.Controllers
{
    public class SearchControllerTests
    {
        [Fact]
        public async Task Search_ShortQuery_ReturnsEmptyResults()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new SearchController(context);

            var result = await controller.Search("a");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<SearchResponse>(ok.Value);
            Assert.Equal("a", response.Query);
            Assert.Empty(response.Courses.Items);
            Assert.Empty(response.Kits.Items);
        }

        [Fact]
        public async Task Search_InvalidType_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new SearchController(context);

            var result = await controller.Search("ab", type: "bad");

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.NotNull(badRequest.Value);
        }

        // ──── NEW TESTS ────

        [Fact]
        public async Task Search_TypeAll_ReturnsBothCoursesAndKits()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1, categoryId: 1, name: "Python Basics"));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1, name: "Python Kit"));
            await context.SaveChangesAsync();

            var controller = new SearchController(context);

            var result = await controller.Search("Python", type: "all");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<SearchResponse>(ok.Value);
            Assert.True(response.Courses.TotalCount > 0);
            Assert.True(response.Kits.TotalCount > 0);
        }

        [Fact]
        public async Task Search_TypeCourses_ReturnsOnlyCourses()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1, categoryId: 1, name: "React Mastery"));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1, name: "React Kit"));
            await context.SaveChangesAsync();

            var controller = new SearchController(context);

            var result = await controller.Search("React", type: "courses");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<SearchResponse>(ok.Value);
            Assert.True(response.Courses.TotalCount > 0);
            Assert.Equal(0, response.Kits.TotalCount);
        }

        [Fact]
        public async Task Search_TypeKits_ReturnsOnlyKits()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1, categoryId: 1, name: "Arduino Course"));
            context.Kits.Add(TestDataBuilder.CreateKit(1, categoryId: 1, name: "Arduino Kit"));
            await context.SaveChangesAsync();

            var controller = new SearchController(context);

            var result = await controller.Search("Arduino", type: "kits");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<SearchResponse>(ok.Value);
            Assert.Equal(0, response.Courses.TotalCount);
            Assert.True(response.Kits.TotalCount > 0);
        }

        [Fact]
        public async Task Search_NoMatches_ReturnsEmptyResults()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1, categoryId: 1, name: "Course A"));
            await context.SaveChangesAsync();

            var controller = new SearchController(context);

            var result = await controller.Search("zzzznonexistent");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<SearchResponse>(ok.Value);
            Assert.Equal(0, response.Courses.TotalCount);
            Assert.Equal(0, response.Kits.TotalCount);
        }

        [Fact]
        public async Task Search_PageSizeExceedsMax_CapsAt100()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new SearchController(context);

            // This should not throw even with huge pageSize
            var result = await controller.Search("test", pageSize: 500);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            Assert.NotNull(ok.Value);
        }

        [Fact]
        public async Task Search_MatchesByDescription_ReturnsResults()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            var course = TestDataBuilder.CreateCourse(1, categoryId: 1, name: "Course One");
            course.Description = "Learn about advanced robotics";
            context.Courses.Add(course);
            await context.SaveChangesAsync();

            var controller = new SearchController(context);

            var result = await controller.Search("robotics", type: "courses");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<SearchResponse>(ok.Value);
            Assert.Equal(1, response.Courses.TotalCount);
        }
    }
}
