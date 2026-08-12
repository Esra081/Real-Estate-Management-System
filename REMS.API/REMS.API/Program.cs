using Microsoft.EntityFrameworkCore;
using REMS.API.Data;
using REMS.API.Interfaces;
using REMS.API.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<REMS.API.Data.RemsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
    o => o.UseNetTopologySuite()));

// Property servis bağımlılığı
builder.Services.AddScoped<IPropertyService, PropertyService>();

// Hash servisimiz
builder.Services.AddScoped<HashService>();

// Auth servis bağımlılığı
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

await app.RunAsync();
