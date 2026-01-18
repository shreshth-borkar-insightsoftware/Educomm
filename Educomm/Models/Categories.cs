using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Educomm.Models
{
    public class Category
    {
        [Key]
        public int CategoryId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        public string Description { get; set; }

        public bool IsActive { get; set; } = true;
        public ICollection<Course> Courses { get; set; } = new List<Course>();
        public ICollection<Kit> Kits { get; set; } = new List<Kit>();
    }
}