using Microsoft.EntityFrameworkCore;
using REMS.API.Data;
using REMS.API.Interfaces;
using REMS.API.Services;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "Esraklc.081";
var fullConnectionString = $"{connectionString};Password={dbPassword};";

builder.Services.AddDbContext<REMS.API.Data.RemsDbContext>(options =>
    options.UseNpgsql(fullConnectionString,
    o => o.UseNetTopologySuite()));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200") // Sadece Angular'a izin ver
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var jwtKey = builder.Configuration["Jwt:Key"] ?? "REMS_GIS_Secret_Key_Super_Secret_2026_Secure_Token_Authentication!";
var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "http://localhost:5000",
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "http://localhost:5000",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddScoped<ITasinmazService, TasinmazService>();

builder.Services.AddScoped<IIlService, IlService>();

builder.Services.AddScoped<IIlceService, IlceService>();

builder.Services.AddScoped<HashService>();

builder.Services.AddScoped<IGirisService, GirisService>();

builder.Services.AddScoped<IMahalleService, MahalleService>();

builder.Services.AddScoped<IExportService, ExportService>();

builder.Services.AddScoped<IImportService, ImportService>();

builder.Services.AddScoped<IKullaniciService, KullaniciService>();

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<ILogService, LogService>();

builder.Services.AddScoped<IAlanAnaliziService, AlanAnaliziService>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowNamedFloatingPointLiterals;

        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;

        options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors("AllowAngular");

app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<REMS.API.Data.RemsDbContext>();
    try
    {
        await db.Database.ExecuteSqlRawAsync("ALTER TABLE IF EXISTS \"Tasinmazlar\" ADD COLUMN IF NOT EXISTS resim_url text;");
        await db.Database.ExecuteSqlRawAsync("ALTER TABLE IF EXISTS \"tasinmazlar\" ADD COLUMN IF NOT EXISTS resim_url text;");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"DB Migration Notice: {ex.Message}");
    }
}

await app.RunAsync();
