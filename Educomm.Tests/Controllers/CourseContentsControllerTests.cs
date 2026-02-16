using Educomm.Controllers;
using Educomm.Models;
using Educomm.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Educomm.Tests.Controllers
{
    public class CourseContentsControllerTests
    {
        [Fact]
        public async Task GetContentForCourse_CourseNotFound_ReturnsNotFound()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new CourseContentsController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.GetContentForCourse(999);

            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal("Course not found.", notFound.Value);
        }

        [Fact]
        public async Task GetContentForCourse_NotEnrolled_ReturnsForbidden()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1));
            await context.SaveChangesAsync();

            var controller = new CourseContentsController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.GetContentForCourse(1);

            var forbidden = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(403, forbidden.StatusCode);
        }

        [Fact]
        public async Task GetContentForCourse_AdminNoContent_ReturnsMessage()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1));
            await context.SaveChangesAsync();

            var controller = new CourseContentsController(context);
            TestControllerContext.SetUser(controller, userId: 1, role: "Admin");

            var result = await controller.GetContentForCourse(1);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal("You are enrolled, but this course has no content yet.", ok.Value);
        }

        [Fact]
        public async Task PostCourseContent_InvalidCourse_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new CourseContentsController(context);

            var content = TestDataBuilder.CreateCourseContent(1, courseId: 99);
            var result = await controller.PostCourseContent(content);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Invalid CourseId. That course does not exist.", badRequest.Value);
        }

        [Fact]
        public async Task GetContentForCourse_Enrolled_ReturnsContent()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1));
            context.Users.Add(TestDataBuilder.CreateUser(2, "user2@example.com"));
            context.Enrollments.Add(TestDataBuilder.CreateEnrollment(1, userId: 2, courseId: 1));
            context.CourseContents.Add(TestDataBuilder.CreateCourseContent(1, courseId: 1));
            await context.SaveChangesAsync();

            var controller = new CourseContentsController(context);
            TestControllerContext.SetUser(controller, userId: 2);

            var result = await controller.GetContentForCourse(1);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var content = Assert.IsType<List<CourseContent>>(ok.Value);
            Assert.Single(content);
        }

        // ──── NEW TESTS ────

        [Fact]
        public async Task GetContentForCourse_EnrolledNoContent_ReturnsMessage()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1));
            context.Users.Add(TestDataBuilder.CreateUser(2, "user2@example.com"));
            context.Enrollments.Add(TestDataBuilder.CreateEnrollment(1, userId: 2, courseId: 1));
            // No content added
            await context.SaveChangesAsync();

            var controller = new CourseContentsController(context);
            TestControllerContext.SetUser(controller, userId: 2);

            var result = await controller.GetContentForCourse(1);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal("You are enrolled, but this course has no content yet.", ok.Value);
        }

        [Fact]
        public async Task GetContentForCourse_AdminWithContent_ReturnsContent()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1));
            context.CourseContents.AddRange(
                TestDataBuilder.CreateCourseContent(1, courseId: 1, title: "Lesson 1"),
                TestDataBuilder.CreateCourseContent(2, courseId: 1, title: "Lesson 2"));
            await context.SaveChangesAsync();

            var controller = new CourseContentsController(context);
            TestControllerContext.SetUser(controller, userId: 1, role: "Admin");

            var result = await controller.GetContentForCourse(1);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var content = Assert.IsType<List<CourseContent>>(ok.Value);
            Assert.Equal(2, content.Count);
        }

        [Fact]
        public async Task PostCourseContent_ValidCourse_ReturnsOk()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1));
            await context.SaveChangesAsync();

            var controller = new CourseContentsController(context);

            var content = TestDataBuilder.CreateCourseContent(1, courseId: 1, title: "New Lesson");
            var result = await controller.PostCourseContent(content);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var saved = Assert.IsType<CourseContent>(ok.Value);
            Assert.Equal("New Lesson", saved.Title);
            Assert.Single(context.CourseContents);
        }
    }
}
