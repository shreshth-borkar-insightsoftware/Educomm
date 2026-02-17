using Microsoft.EntityFrameworkCore;
using Educomm.Models;

namespace Educomm.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Kit> Kits { get; set; }
        public DbSet<CourseContent> CourseContents { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Enrollments> Enrollments { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<CourseContentProgress> CourseContentProgress { get; set; }

    }
}