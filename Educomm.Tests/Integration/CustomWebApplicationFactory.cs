using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Educomm.Data;
using Educomm.Services;
using Moq;
using Stripe.Checkout;

namespace Educomm.Tests.Integration
{
    /// <summary>
    /// Custom WebApplicationFactory that replaces PostgreSQL with SQLite in-memory
    /// and provides a mock IStripeService for integration testing.
    /// </summary>
    public class CustomWebApplicationFactory : WebApplicationFactory<Program>
    {
        // Keep the connection open for the lifetime of the factory
        private SqliteConnection? _connection;

        public Mock<IStripeService> MockStripeService { get; } = new Mock<IStripeService>();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            builder.ConfigureServices(services =>
            {
                // Remove ALL DbContext-related registrations (including Npgsql internals)
                var dbDescriptors = services
                    .Where(d => d.ServiceType.FullName?.Contains("EntityFrameworkCore") == true
                             || d.ServiceType.FullName?.Contains("Npgsql") == true
                             || d.ServiceType == typeof(DbContextOptions<AppDbContext>)
                             || d.ServiceType == typeof(DbContextOptions))
                    .ToList();
                foreach (var descriptor in dbDescriptors)
                    services.Remove(descriptor);

                // Remove any existing IStripeService registration
                var stripeDescriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(IStripeService));
                if (stripeDescriptor != null)
                    services.Remove(stripeDescriptor);

                // Create and open a persistent SQLite in-memory connection
                _connection = new SqliteConnection("DataSource=:memory:");
                _connection.Open();

                // Register SQLite-backed AppDbContext
                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseSqlite(_connection);
                });

                // Register mocked IStripeService
                services.AddScoped<IStripeService>(_ => MockStripeService.Object);

                // Build a temporary service provider to create/migrate the database
                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                db.Database.EnsureCreated();
            });

            // Override configuration with test values
            builder.ConfigureAppConfiguration((context, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Jwt:Key"] = "ThisIsAVeryLongTestSecretKeyForIntegrationTests1234567890ABCDEFGHIJKLMNOP!",
                    ["Stripe:SecretKey"] = "sk_test_fake",
                    ["Stripe:PublishableKey"] = "pk_test_fake",
                    ["Stripe:WebhookSecret"] = "whsec_test_fake"
                });
            });
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            if (disposing)
            {
                _connection?.Close();
                _connection?.Dispose();
            }
        }
    }
}
