using System;
using Microsoft.EntityFrameworkCore;
using REMS.API.Entities;

namespace REMS.API.Data
{
    public class RemsDbContext : DbContext
    {
        public RemsDbContext(DbContextOptions<RemsDbContext> options) : base(options)
        {
        }

        public DbSet<Kullanici> Kullanicilar { get; set; }
        public DbSet<Il> Iller { get; set; }
        public DbSet<Ilce> Ilceler { get; set; }
        public DbSet<Mahalle> Mahalleler { get; set; }
        public DbSet<Tasinmaz> Tasinmazlar { get; set; }

        public DbSet<Log> Loglar { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. İller (Kusursuz Türkçe)
            modelBuilder.Entity<Il>().HasData(
                new Il { Id = 1, Ad = "Ankara" },
                new Il { Id = 2, Ad = "İstanbul" }
            );

            // 2. İlçeler 
            modelBuilder.Entity<Ilce>().HasData(
                new Ilce { Id = 1, Ad = "Çankaya", IlId = 1 },
                new Ilce { Id = 2, Ad = "Yenimahalle", IlId = 1 },
                new Ilce { Id = 3, Ad = "Kadıköy", IlId = 2 },
                new Ilce { Id = 4, Ad = "Beşiktaş", IlId = 2 }
            );

            // 3. Mahalleler
            modelBuilder.Entity<Mahalle>().HasData(
                new Mahalle { Id = 1, Ad = "Kavaklıdere Mahallesi", IlceId = 1 },
                new Mahalle { Id = 2, Ad = "Bahçelievler Mahallesi", IlceId = 1 },
                new Mahalle { Id = 3, Ad = "Batıkent Mahallesi", IlceId = 2 },
                new Mahalle { Id = 4, Ad = "Caferağa Mahallesi", IlceId = 3 },
                new Mahalle { Id = 5, Ad = "Moda Mahallesi", IlceId = 3 },
                new Mahalle { Id = 6, Ad = "Bebek Mahallesi", IlceId = 4 }
            );

            modelBuilder.Entity<Kullanici>().HasData(
                new Kullanici
                {
                    Id = Guid.Parse("d28888e9-2ba9-473a-a40f-e38cb54f9b35"),
                    AdSoyad = "Sistem Yöneticisi",
                    Email = "admin@rems.com",
                    SifreHash = "xGdPN49aJiC+vNCrJv+l5rWVse55J86Cvh2zr24NFDs=",
                    SifreSalt = "K8j9Lm2N4p6Q8r0T2v4X6z8B0d2F4h6J",
                    Rol = "Admin",
                    OlusturmaTarihi = new DateTime(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc),
                    AktifMi = true
                }
            );
        }
    }
}