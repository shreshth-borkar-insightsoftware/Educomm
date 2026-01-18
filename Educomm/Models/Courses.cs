using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Educomm.Models
{
    public class Course
    {
        [Key]
        public int CourseId { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [ForeignKey("CategoryId")]
        [JsonIgnore]
        public Category? Category { get; set; }


        [Required]
        [MaxLength(200)]
        public string Name { get; set; }

        public string Description { get; set; }
        public string Difficulty { get; set; }
        public int DurationMinutes { get; set; }
        public string ThumbnailUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public ICollection<Kit> Kits { get; set; } = new List<Kit>();
        public ICollection<CourseContent> CourseContents { get; set; } = new List<CourseContent>();
    }
}