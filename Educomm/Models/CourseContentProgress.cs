using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Educomm.Models
{
    public class CourseContentProgress
    {
        [Key]
        public int CourseContentProgressId { get; set; }

        [Required]
        public int EnrollmentId { get; set; }

        [ForeignKey("EnrollmentId")]
        [JsonIgnore]
        public Enrollments? Enrollment { get; set; }

        [Required]
        public int CourseContentId { get; set; }

        [ForeignKey("CourseContentId")]
        [JsonIgnore]
        public CourseContent? CourseContent { get; set; }

        public bool IsCompleted { get; set; } = false;

        public DateTime? CompletedAt { get; set; }
    }
}
