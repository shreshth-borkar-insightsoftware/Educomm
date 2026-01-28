using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Educomm.Models
{
    [Table("users")]
    public class User
    {
        [Key]
        [Column("user_id")]
        public int UserId { get; set; }

        [Required]
        [Column("email")]
        public string Email { get; set; }

        [Required]
        [Column("password_hash")]
        public string PasswordHash { get; set; }

        [Required]
        [Column("first_name")]
        public string FirstName { get; set; }

        [Required]
        [Column("last_name")]
        public string LastName { get; set; }

        [Column("phone_number")]
        public string PhoneNumber { get; set; }

        [Required]
        [Column("role")]
        public string Role { get; set; } = "Customer";

        [JsonIgnore]
        public Cart? Cart { get; set; }
    }
}