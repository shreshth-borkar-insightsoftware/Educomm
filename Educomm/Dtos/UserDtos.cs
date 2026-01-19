using System.ComponentModel.DataAnnotations;

namespace Educomm.Dtos
{
    //For creating users
    public class UserCreateDto
    {
        [Required]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }

        [Required]
        public string FirstName { get; set; }

        [Required]
        public string LastName { get; set; }

        public string? PhoneNumber { get; set; }
    }

    //For returning users
    public class UserResponseDto
    {
        public int UserId { get; set; }

        public string Email { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string? PhoneNumber { get; set; }

        public string Role { get; set; }

        public bool IsEmailVerified { get; set; }

        public bool IsActive { get; set; }
    }
}
