using Educomm.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Educomm.Tests.Helpers
{
    public static class TestDbContextFactory
    {
        public static AppDbContext CreateContext(string databaseName)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName)
                .EnableSensitiveDataLogging()
                .Options;

            return new AppDbContext(options);
        }

        public static SqliteTestDbContext CreateSqliteContext()
        {
            return new SqliteTestDbContext();
        }
    }

    public sealed class SqliteTestDbContext : IDisposable
    {
        private readonly SqliteConnection _connection;
        public AppDbContext Context { get; }

        public SqliteTestDbContext()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(_connection)
                .EnableSensitiveDataLogging()
                .Options;

            Context = new AppDbContext(options);
            Context.Database.EnsureCreated();
        }

        public void Dispose()
        {
            Context.Dispose();
            _connection.Close();
            _connection.Dispose();
        }
    }
}
