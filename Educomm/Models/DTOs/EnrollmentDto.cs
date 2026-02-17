namespace Educomm.Models.DTOs
{
    public class EnrollmentDto
    {
        public int EnrollmentId { get; set; }
        public int UserId { get; set; }
        public int CourseId { get; set; }
        public string? CourseName { get; set; }
        public DateTime EnrolledAt { get; set; }
        public bool IsCompleted { get; set; }
        public int ProgressPercentage { get; set; }
        public int TotalModules { get; set; }
        public int CompletedModules { get; set; }
    }
}
