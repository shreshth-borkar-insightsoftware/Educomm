using Educomm.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// var options = new DbContextOptions(); 
// options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));            
// builder.Services.AddDbContext(options);

//Database Connetion new way
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// first check If devloper is asking for swagger then give permission
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//to just always go to https
app.UseHttpsRedirection();

app.MapControllers();
app.Run();