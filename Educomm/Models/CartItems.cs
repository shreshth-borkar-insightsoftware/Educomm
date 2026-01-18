using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Educomm.Models
{
    public class CartItem
    {
        [Key]
        public int CartItemId { get; set; }

        // --- Link to Cart ---
        [Required]
        public int CartId { get; set; }

        [ForeignKey("CartId")]
        [JsonIgnore]
        public Cart? Cart { get; set; }

        // --- Link to Product (Kit) ---
        [Required]
        public int KitId { get; set; }

        [ForeignKey("KitId")]
        public Kit? Kit { get; set; }

        // --- Details ---
        public int Quantity { get; set; } = 1;

        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}