using Educomm.Models;

namespace Educomm.Tests.Helpers
{
    public static class TestDataBuilder
    {
        public static Category CreateCategory(int id = 1, string name = "Category 1")
        {
            return new Category
            {
                CategoryId = id,
                Name = name,
                Description = "Category description",
                IsActive = true
            };
        }

        public static Course CreateCourse(int id = 1, int categoryId = 1, string name = "Course 1")
        {
            return new Course
            {
                CourseId = id,
                CategoryId = categoryId,
                Name = name,
                Description = "Course description",
                Difficulty = "Beginner",
                DurationMinutes = 60,
                ThumbnailUrl = "https://example.com/course.png",
                IsActive = true
            };
        }

        public static Kit CreateKit(int id = 1, int categoryId = 1, int? courseId = null, string name = "Kit 1")
        {
            return new Kit
            {
                KitId = id,
                CategoryId = categoryId,
                CourseId = courseId,
                Name = name,
                Description = "Kit description",
                SKU = $"SKU-{id}",
                Price = 19.99m,
                StockQuantity = 10,
                ImageUrl = "https://example.com/kit.png",
                Weight = 1.5m,
                Dimensions = "10x10x10",
                IsActive = true
            };
        }

        public static User CreateUser(int id = 1, string email = "user@example.com", string role = "User")
        {
            return new User
            {
                UserId = id,
                Email = email,
                Role = role,
                FirstName = "Test",
                LastName = "User",
                PhoneNumber = "1234567890",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("P@ssw0rd")
            };
        }

        public static Address CreateAddress(int id = 1, int userId = 1, string title = "Home")
        {
            return new Address
            {
                AddressId = id,
                UserId = userId,
                Title = title,
                Street = "123 Main St",
                City = "City",
                State = "State",
                ZipCode = "12345",
                Country = "Country",
                PhoneNumber = "1234567890"
            };
        }

        public static CourseContent CreateCourseContent(int id = 1, int courseId = 1, string title = "Lesson 1")
        {
            return new CourseContent
            {
                ContentId = id,
                CourseId = courseId,
                ContentType = "video",
                Title = title,
                ContentUrl = "https://example.com/video.mp4",
                SequenceOrder = 1,
                DurationSeconds = 120
            };
        }

        public static Enrollments CreateEnrollment(int id = 1, int userId = 1, int courseId = 1)
        {
            return new Enrollments
            {
                EnrollmentId = id,
                UserId = userId,
                CourseId = courseId,
                EnrolledAt = DateTime.UtcNow,
                ProgressPercentage = 0,
                IsCompleted = false
            };
        }

        public static Order CreateOrder(int id = 1, int userId = 1, string status = "Pending")
        {
            return new Order
            {
                OrderId = id,
                UserId = userId,
                OrderDate = DateTime.UtcNow,
                Status = status,
                ShippingAddress = "Test Address",
                TotalAmount = 25.00m
            };
        }

        public static OrderItem CreateOrderItem(int id = 1, int orderId = 1, int kitId = 1)
        {
            return new OrderItem
            {
                OrderItemId = id,
                OrderId = orderId,
                KitId = kitId,
                Quantity = 1,
                PriceAtPurchase = 25.00m
            };
        }

        public static Cart CreateCart(int id = 1, int userId = 1)
        {
            return new Cart
            {
                CartId = id,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static CartItem CreateCartItem(int id = 1, int cartId = 1, int kitId = 1, int quantity = 1)
        {
            return new CartItem
            {
                CartItemId = id,
                CartId = cartId,
                KitId = kitId,
                Quantity = quantity,
                AddedAt = DateTime.UtcNow
            };
        }
    }
}
