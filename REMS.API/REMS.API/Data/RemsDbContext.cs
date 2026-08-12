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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // PostGIS uzantısını veritabanında kullanacağımızı belirtiyoruz
            modelBuilder.HasPostgresExtension("postgis");

            // --- DATA SEEDING (VERİ TOHUMLAMA) ---

            // 1. İller
            modelBuilder.Entity<Il>().HasData(
                new Il { Id = 1, Ad = "Ankara" },
                new Il { Id = 2, Ad = "Düzce" }
            );

            // 2. İlçeler
            modelBuilder.Entity<Ilce>().HasData(
                new Ilce { Id = 1, Ad = "Çankaya", IlId = 1 },
                new Ilce { Id = 2, Ad = "Yenimahalle", IlId = 1 },
                new Ilce { Id = 3, Ad = "Merkez", IlId = 2 },
                new Ilce { Id = 4, Ad = "Akçakoca", IlId = 2 }
            );

            // 3. Mahalleler
            modelBuilder.Entity<Mahalle>().HasData(
                new Mahalle { Id = 1, Ad = "Bahçelievler Mahallesi", IlceId = 1 },
                new Mahalle { Id = 2, Ad = "Beştepe Mahallesi", IlceId = 2 },
                new Mahalle { Id = 3, Ad = "Konuralp Mahallesi", IlceId = 3 },
                new Mahalle { Id = 4, Ad = "Osmaniye Mahallesi", IlceId = 4 }
            );

            // 4. Varsayılan Admin Kullanıcısı
            // Not: Seeding işleminde Guid değerleri sabit (hardcoded) verilmelidir ki her migration'da değişmesin.
            modelBuilder.Entity<Kullanici>().HasData(
                new Kullanici
                {
                    Id = Guid.Parse("d28888e9-2ba9-473a-a40f-e38cb54f9b35"),
                    AdSoyad = "Sistem Yöneticisi",
                    Email = "admin@rems.com",
                    SifreHash = "ornek_hash", // Gerçek projede buralar hashlenmiş gerçek şifreler olur
                    SifreSalt = "ornek_salt",
                    Rol = "Admin",
                    OlusturmaTarihi = new DateTime(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc),
                    AktifMi = true
                }
            );
        }
    }
}