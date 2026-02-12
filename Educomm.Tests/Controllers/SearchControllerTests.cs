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
    }
}
