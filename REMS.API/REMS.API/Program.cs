using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using REMS.API.Data;
using REMS.API.Interfaces;
using REMS.API.Middleware;
using REMS.API.Services;
using System.Text;
using System.Text.Json.Serialization;
using REMS.API.Mappings;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? builder.Configuration["DbPassword"] ?? "Esraklc.081";
var fullConnectionString = (!string.IsNullOrEmpty(dbPassword) && !connectionString.Contains("Password="))
    ? $"{connectionString};Password={dbPassword};"
    : connectionString;

// postgis geometri desteği için npgsql bağlantısına nettopologysuite ekliyoruz
builder.Services.AddDbContext<REMS.API.Data.RemsDbContext>(options =>
    options.UseNpgsql(fullConnectionString,
    o => o.UseNetTopologySuite()));

// angular frontend localhost:4200 portunda çalıştığı için cors ile backend erişimine izin veriyoruz
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
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
        // token süresi biter bitmez anında 401 versin diye varsayılan 5 dakikalık toleransı sıfırladım
        ClockSkew = TimeSpan.Zero
    };
});

// entity dto eşlemelerini otomatikleştirmek için automapper profilimizi ekledik
builder.Services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());

// http isteği boyunca aynı db context ve servis örneği kullanılsın diye scoped tanımlıyoruz
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

app.UseMiddleware<GlobalExceptionMiddleware>();

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
