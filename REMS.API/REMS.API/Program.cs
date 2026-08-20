using Microsoft.EntityFrameworkCore;
using REMS.API.Data;
using REMS.API.Interfaces;
using REMS.API.Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "Esraklc.081";
var fullConnectionString = $"{connectionString};Password={dbPassword};";

builder.Services.AddDbContext<REMS.API.Data.RemsDbContext>(options =>
    options.UseNpgsql(fullConnectionString,
    o => o.UseNetTopologySuite()));

// Angular'a (4200 portuna) izin veren CORS ayarımız
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200") // Sadece Angular'a izin ver
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
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


builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // 1. Sonsuz veya özel ondalıklı sayıların (koordinatlar gibi) JSON'a çevrilmesine izin veririz.
        options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowNamedFloatingPointLiterals;

        // 2. Ekstra Güvenlik: Veritabanı tabloları birbirine bağlıysa (ilişkiliyse) 
        // JSON'a çevirirken sonsuz döngüye girmesini (Reference Loop) engelleriz.
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;

        // Türkçe karakterlerin JSON içinde bozulmasını (escape edilmesini) engeller
        options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors("AllowAngular"); // Bu satır genelde app.UseHttpsRedirection(); veya app.UseRouting(); satırlarının hemen yanına/altına yazılır.

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

await app.RunAsync();
