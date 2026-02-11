namespace Educomm.Models.DTOs
{
    public class SearchResponse
    {
        public string Query { get; set; } = string.Empty;
        public SearchResultSet Courses { get; set; } = new SearchResultSet();
        public SearchResultSet Kits { get; set; } = new SearchResultSet();
    }

    public class SearchResultSet
    {
        public List<object> Items { get; set; } = new List<object>();
        public int TotalCount { get; set; } = 0;
    }
}
