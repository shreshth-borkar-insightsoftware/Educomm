using Educomm.Controllers;
using Educomm.Models;
using Educomm.Models.DTOs;
using Educomm.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Educomm.Tests.Controllers
{
    public class EnrollmentsControllerTests
    {
        [Fact]
        public async Task GetMyEnrollments_ReturnsPaginatedResponse()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1));
            context.Enrollments.Add(TestDataBuilder.CreateEnrollment(1, userId: 1, courseId: 1));
            await context.SaveChangesAsync();

            var controller = new EnrollmentsController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            var result = await controller.GetMyEnrollments();

            var response = Assert.IsType<PaginatedResponse<Enrollments>>(result.Value);
            Assert.Equal(1, response.TotalCount);
            Assert.Single(response.Items);
        }

        [Fact]
        public async Task EnrollUser_AlreadyEnrolled_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1));
            context.Enrollments.Add(TestDataBuilder.CreateEnrollment(1, userId: 1, courseId: 1));
            await context.SaveChangesAsync();

            var controller = new EnrollmentsController(context);

            var result = await controller.EnrollUser(TestDataBuilder.CreateEnrollment(2, userId: 1, courseId: 1));

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("User is already enrolled.", badRequest.Value);
        }

        [Fact]
        public async Task EnrollUser_InvalidCourse_ReturnsBadRequest()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new EnrollmentsController(context);

            var result = await controller.EnrollUser(TestDataBuilder.CreateEnrollment(1, userId: 1, courseId: 99));

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Invalid CourseId.", badRequest.Value);
        }

        [Fact]
        public async Task GetAllEnrollments_ReturnsPaginatedResponse()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "u1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1));
            context.Enrollments.Add(TestDataBuilder.CreateEnrollment(1, userId: 1, courseId: 1));
            await context.SaveChangesAsync();

            var controller = new EnrollmentsController(context);

            var result = await controller.GetAllEnrollments();

            var response = Assert.IsType<PaginatedResponse<Enrollments>>(result.Value);
            Assert.Equal(1, response.TotalCount);
            Assert.Single(response.Items);
        }

        [Fact]
        public async Task DeleteEnrollment_NotFound_ReturnsNotFound()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            var controller = new EnrollmentsController(context);

            var result = await controller.DeleteEnrollment(999);

            var notFound = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Enrollment not found.", notFound.Value);
        }

        [Fact]
        public async Task DeleteEnrollment_Existing_ReturnsOk()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            context.Courses.Add(TestDataBuilder.CreateCourse(1));
            context.Enrollments.Add(TestDataBuilder.CreateEnrollment(1, userId: 1, courseId: 1));
            await context.SaveChangesAsync();

            var controller = new EnrollmentsController(context);

            var result = await controller.DeleteEnrollment(1);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Enrollment deleted successfully.", ok.Value);
        }

        [Fact]
        public async Task GetMyEnrollments_PageSizeExceedsMaximum_CapsAtMaxPageSize()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            // Create 150 courses and enrollments to test the limit
            for (var i = 1; i <= 150; i++)
            {
                context.Courses.Add(TestDataBuilder.CreateCourse(i));
                context.Enrollments.Add(TestDataBuilder.CreateEnrollment(i, userId: 1, courseId: i));
            }
            await context.SaveChangesAsync();

            var controller = new EnrollmentsController(context);
            TestControllerContext.SetUser(controller, userId: 1);

            // Request 300 items
            var result = await controller.GetMyEnrollments(page: 1, pageSize: 300);

            var response = Assert.IsType<PaginatedResponse<Enrollments>>(result.Value);
            // Should only return 100 items (MAX_PAGE_SIZE)
            Assert.Equal(100, response.Items.Count());
            Assert.Equal(100, response.PageSize);
        }

        [Fact]
        public async Task GetAllEnrollments_PageSizeExceedsMaximum_CapsAtMaxPageSize()
        {
            using var db = TestDbContextFactory.CreateSqliteContext();
            var context = db.Context;
            context.Users.Add(TestDataBuilder.CreateUser(1, "user1@example.com"));
            context.Categories.Add(TestDataBuilder.CreateCategory(1));
            // Create 150 courses and enrollments to test the limit
            for (var i = 1; i <= 150; i++)
            {
                context.Courses.Add(TestDataBuilder.CreateCourse(i));
                context.Enrollments.Add(TestDataBuilder.CreateEnrollment(i, userId: 1, courseId: i));
            }
            await context.SaveChangesAsync();

            var controller = new EnrollmentsController(context);

            // Request 500 items
            var result = await controller.GetAllEnrollments(page: 1, pageSize: 500);

            var response = Assert.IsType<PaginatedResponse<Enrollments>>(result.Value);
            // Should only return 100 items (MAX_PAGE_SIZE)
            Assert.Equal(100, response.Items.Count());
            Assert.Equal(100, response.PageSize);
        }
    }
}
