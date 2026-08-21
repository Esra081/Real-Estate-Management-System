using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using REMS.API.Data;
using REMS.API.DTOs.Kullanici;
using REMS.API.Entities;
using REMS.API.Helpers;
using REMS.API.Interfaces;

namespace REMS.API.Services
{
    public class KullaniciService : IKullaniciService
    {
        private readonly RemsDbContext _context;
        private readonly HashService _hashService;

        public KullaniciService(RemsDbContext context, HashService hashService)
        {
            _context = context;
            _hashService = hashService;
        }

        public async Task<List<KullaniciListDto>> GetAllKullanicilarAsync()
        {
            var kullanicilar = await _context.Kullanicilar
                .AsNoTracking()
                .OrderByDescending(k => k.OlusturmaTarihi)
                .ToListAsync();

            var list = new List<KullaniciListDto>();
            foreach (var k in kullanicilar)
            {
                string kIdStr = k.Id.ToString();
                int tasinmazSayisi = await _context.Tasinmazlar.CountAsync(t => t.KullaniciId == kIdStr);

                list.Add(new KullaniciListDto
                {
                    Id = k.Id,
                    AdSoyad = k.AdSoyad,
                    Email = k.Email,
                    Rol = k.Rol,
                    OlusturmaTarihi = k.OlusturmaTarihi,
                    AktifMi = k.AktifMi,
                    TasinmazSayisi = tasinmazSayisi
                });
            }

            return list;
        }

        public async Task<KullaniciListDto?> GetKullaniciByIdAsync(Guid id)
        {
            var k = await _context.Kullanicilar.FindAsync(id);
            if (k == null) return null;

            string kIdStr = k.Id.ToString();
            int tasinmazSayisi = await _context.Tasinmazlar.CountAsync(t => t.KullaniciId == kIdStr);

            return new KullaniciListDto
            {
                Id = k.Id,
                AdSoyad = k.AdSoyad,
                Email = k.Email,
                Rol = k.Rol,
                OlusturmaTarihi = k.OlusturmaTarihi,
                AktifMi = k.AktifMi,
                TasinmazSayisi = tasinmazSayisi
            };
        }

        public async Task<(bool Success, string Message)> AddKullaniciAsync(KullaniciCreateDto model)
        {
            if (string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.AdSoyad))
                return (false, "Ad Soyad ve E-posta alanları zorunludur.");

            bool emailVarMi = await _context.Kullanicilar.AnyAsync(k => k.Email.ToLower() == model.Email.ToLower().Trim());
            if (emailVarMi)
                return (false, "Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcut.");

            var (sifreGecerli, sifreHata) = SifreGecerliMi(model.Sifre);
            if (!sifreGecerli)
                return (false, sifreHata);

            string salt = _hashService.CreateSalt();
            string hash = _hashService.HashPassword(model.Sifre, salt);

            var yeniKullanici = new Kullanici
            {
                Id = Guid.NewGuid(),
                AdSoyad = model.AdSoyad.Trim(),
                Email = model.Email.ToLower().Trim(),
                SifreHash = hash,
                SifreSalt = salt,
                Rol = string.IsNullOrWhiteSpace(model.Rol) ? "Kullanici" : model.Rol,
                AktifMi = true,
                OlusturmaTarihi = DateTime.UtcNow
            };

            await _context.Kullanicilar.AddAsync(yeniKullanici);
            await _context.SaveChangesAsync();

            return (true, "Kullanıcı başarıyla oluşturuldu.");
        }

        public async Task<(bool Success, string Message)> UpdateKullaniciAsync(KullaniciUpdateDto model)
        {
            var kullanici = await _context.Kullanicilar.FindAsync(model.Id);
            if (kullanici == null)
                return (false, "Güncellenecek kullanıcı bulunamadı.");

            if (kullanici.Email.ToLower() != model.Email.ToLower().Trim())
            {
                bool emailVarMi = await _context.Kullanicilar.AnyAsync(k => k.Email.ToLower() == model.Email.ToLower().Trim() && k.Id != model.Id);
                if (emailVarMi)
                    return (false, "Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.");
            }

            kullanici.AdSoyad = model.AdSoyad.Trim();
            kullanici.Email = model.Email.ToLower().Trim();
            kullanici.Rol = model.Rol;
            kullanici.AktifMi = model.AktifMi;

            if (!string.IsNullOrWhiteSpace(model.YeniSifre))
            {
                var (sifreGecerli, sifreHata) = SifreGecerliMi(model.YeniSifre);
                if (!sifreGecerli)
                    return (false, sifreHata);

                string salt = _hashService.CreateSalt();
                kullanici.SifreSalt = salt;
                kullanici.SifreHash = _hashService.HashPassword(model.YeniSifre, salt);
            }

            await _context.SaveChangesAsync();
            return (true, "Kullanıcı bilgileri güncellendi.");
        }

        public async Task<(bool Success, string Message)> DeleteKullaniciAsync(Guid id)
        {
            var kullanici = await _context.Kullanicilar.FindAsync(id);
            if (kullanici == null)
                return (false, "Silinecek kullanıcı bulunamadı.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                string kIdStr = id.ToString();
                var kullaniciTasinmazlari = await _context.Tasinmazlar
                    .Where(t => t.KullaniciId == kIdStr)
                    .ToListAsync();

                if (kullaniciTasinmazlari.Any())
                {
                    _context.Tasinmazlar.RemoveRange(kullaniciTasinmazlari);
                }

                _context.Kullanicilar.Remove(kullanici);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return (true, $"Kullanıcı ve ona ait {kullaniciTasinmazlari.Count} adet taşınmaz başarıyla silindi.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, $"Silme işlemi sırasında hata oluştu: {ex.Message}");
            }
        }

        private (bool Gecerli, string Hata) SifreGecerliMi(string sifre)
        {
            return PasswordValidator.SifreGecerliMi(sifre);
        }
    }
}