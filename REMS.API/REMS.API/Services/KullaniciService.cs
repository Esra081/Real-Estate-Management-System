using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using AutoMapper;
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
        private readonly IMapper _mapper;

        public KullaniciService(RemsDbContext context, HashService hashService, IMapper mapper)
        {
            _context = context;
            _hashService = hashService;
            _mapper = mapper;
        }

        public async Task<List<KullaniciListDto>> GetAllKullanicilarAsync()
        {
            var kullanicilar = await _context.Kullanicilar
                .AsNoTracking()
                .OrderByDescending(k => k.OlusturmaTarihi)
                .ToListAsync();

            // N+1 sorgu problemi engellendi: Tek seferde tüm kullanıcıların taşınmaz sayıları çekilir
            var tasinmazSayilari = await _context.Tasinmazlar
                .AsNoTracking()
                .Where(t => t.KullaniciId != null)
                .GroupBy(t => t.KullaniciId!)
                .Select(g => new { KullaniciId = g.Key, Adet = g.Count() })
                .ToDictionaryAsync(x => x.KullaniciId.ToLower(), x => x.Adet);


            //return kullanicilar.Select(k =>
            //{
            //    string kIdStr = k.Id.ToString().ToLower();
            //    tasinmazSayilari.TryGetValue(kIdStr, out int tasinmazSayisi);
            //
            //    return new KullaniciListDto
            //    {
            //        Id = k.Id,
            //        AdSoyad = k.AdSoyad,
            //        Email = k.Email,
            //        Rol = k.Rol,
            //        OlusturmaTarihi = k.OlusturmaTarihi,
            //        AktifMi = k.AktifMi,
            //        TasinmazSayisi = tasinmazSayisi
            //    };
            //}).ToList();

            // YENİ AUTOMAPPER KULLANIMI
            var dtoList = _mapper.Map<List<KullaniciListDto>>(kullanicilar);
            foreach (var dto in dtoList)
            {
                string kIdStr = dto.Id.ToString().ToLower();
                if (tasinmazSayilari.TryGetValue(kIdStr, out int count))
                {
                    dto.TasinmazSayisi = count;
                }
            }
            return dtoList;
        }

        public async Task<KullaniciListDto?> GetKullaniciByIdAsync(Guid id)
        {
            var k = await _context.Kullanicilar.FindAsync(id);
            if (k == null) return null;

            string kIdStr = k.Id.ToString();
            int tasinmazSayisi = await _context.Tasinmazlar.CountAsync(t => t.KullaniciId == kIdStr);

            //return new KullaniciListDto
            //{
            //    Id = k.Id,
            //    AdSoyad = k.AdSoyad,
            //    Email = k.Email,
            //    Rol = k.Rol,
            //    OlusturmaTarihi = k.OlusturmaTarihi,
            //    AktifMi = k.AktifMi,
            //    TasinmazSayisi = tasinmazSayisi
            //};

            // AUTOMAPPER KULLANIMI
            var dto = _mapper.Map<KullaniciListDto>(k);
            dto.TasinmazSayisi = tasinmazSayisi;
            return dto;
        }

        public async Task<(bool Success, string Message)> AddKullaniciAsync(KullaniciCreateDto model)
        {
            if (string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.AdSoyad))
                return (false, "Ad Soyad ve E-posta alanları zorunludur.");

            var cleanEmail = model.Email.ToLower().Trim();
            bool emailVarMi = await _context.Kullanicilar.AnyAsync(k => k.Email.ToLower() == cleanEmail);
            if (emailVarMi)
                return (false, "Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcut.");

            var (sifreGecerli, sifreHata) = SifreGecerliMi(model.Sifre);
            if (!sifreGecerli)
                return (false, sifreHata);

            string salt = _hashService.CreateSalt();
            string hash = _hashService.HashPassword(model.Sifre, salt);

            // --- ESKİ MANUEL DÖNÜŞÜM (YORUMA ALINDI) ---
            // var yeniKullanici = new Kullanici
            // {
            //     Id = Guid.NewGuid(),
            //     AdSoyad = model.AdSoyad.Trim(),
            //     Email = model.Email.ToLower().Trim(),
            //     SifreHash = hash,
            //     SifreSalt = salt,
            //     Rol = string.IsNullOrWhiteSpace(model.Rol) ? "Kullanici" : model.Rol,
            //     AktifMi = true,
            //     OlusturmaTarihi = DateTime.UtcNow
            // };

            var yeniKullanici = _mapper.Map<Kullanici>(model);
            yeniKullanici.SifreSalt = salt;
            yeniKullanici.SifreHash = hash;

            await _context.Kullanicilar.AddAsync(yeniKullanici);
            await _context.SaveChangesAsync();

            return (true, "Kullanıcı başarıyla oluşturuldu.");
        }

        public async Task<(bool Success, string Message)> UpdateKullaniciAsync(KullaniciUpdateDto model)
        {
            var kullanici = await _context.Kullanicilar.FindAsync(model.Id);
            if (kullanici == null)
                return (false, "Güncellenecek kullanıcı bulunamadı.");

            if (!string.Equals(kullanici.Email, model.Email.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                var cleanEmail = model.Email.ToLower().Trim();
                bool emailVarMi = await _context.Kullanicilar.AnyAsync(k => k.Email.ToLower() == cleanEmail && k.Id != model.Id);
                if (emailVarMi)
                    return (false, "Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.");
            }

            //kullanici.AdSoyad = model.AdSoyad.Trim();
            //kullanici.Email = model.Email.ToLower().Trim();
            //kullanici.Rol = model.Rol;
            //kullanici.AktifMi = model.AktifMi;

            _mapper.Map(model, kullanici);

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

                if (kullaniciTasinmazlari.Count > 0)
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

        private static (bool Gecerli, string Hata) SifreGecerliMi(string sifre)
        {
            return PasswordValidator.SifreGecerliMi(sifre);
        }
    }
}