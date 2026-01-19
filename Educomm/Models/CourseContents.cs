using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Educomm.Models
{
    public class CourseContent
    {
        [Key]
        public int ContentId { get; set; }

        [Required]
        public int CourseId { get; set; }

        [ForeignKey("CourseId")]
        [JsonIgnore]
        public Course? Course { get; set; }

        [Required]
        [MaxLength(50)]
        public string ContentType { get; set; } 

        [Required]
        [MaxLength(200)]
        public string Title { get; set; }

        public string ContentUrl { get; set; }

        public int SequenceOrder { get; set; }

        public int DurationSeconds { get; set; }
    }
}