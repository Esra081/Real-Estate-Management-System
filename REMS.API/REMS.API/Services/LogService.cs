using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using REMS.API.Data;
using REMS.API.DTOs.Common;
using REMS.API.DTOs.Log;
using REMS.API.Entities;
using REMS.API.Interfaces;

namespace REMS.API.Services
{
    public class LogService : ILogService
    {
        private readonly RemsDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public LogService(RemsDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        // 1. Log Kaydetme Metodu (IP ve Kullanıcıyı otomatik yakalayabilir)
        public async Task LogAsync(
            string islemTipi,
            string aciklama,
            string durum = "Basarili",
            string? kullaniciId = null,
            string? kullaniciEmail = null,
            string? ipAdresi = null)
        {
            try
            {
                var httpContext = _httpContextAccessor.HttpContext;

                // Dışarıdan verilmemişse HttpContext üzerinden otomatik alıyoruz
                string ip = ipAdresi ?? httpContext?.Connection?.RemoteIpAddress?.ToString() ?? "Bilinmiyor";
                string? userId = kullaniciId ?? httpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                string? userEmail = kullaniciEmail ?? httpContext?.User?.FindFirst(ClaimTypes.Email)?.Value;

                // EĞER ID HENÜZ YOKSA AMA EMAIL VARSA (Giriş/Kayıt anında), Veritabanından Kullanıcının ID'sini otomatik bul:
                if (string.IsNullOrEmpty(userId) && !string.IsNullOrEmpty(userEmail))
                {
                    var user = await _context.Kullanicilar.AsNoTracking().FirstOrDefaultAsync(k => k.Email.ToLower() == userEmail.ToLower().Trim());
                    if (user != null)
                    {
                        userId = user.Id.ToString();
                    }
                }

                var yeniLog = new Log
                {
                    IslemTipi = islemTipi,
                    Aciklama = aciklama,
                    Durum = durum,
                    KullaniciId = userId,
                    KullaniciEmail = userEmail,
                    IpAdresi = ip,
                    Tarih = DateTime.UtcNow
                };

                await _context.Loglar.AddAsync(yeniLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log kaydederken hata oluşursa ana sistem akışının kesilmemesi için sessizce devam edilir
            }
        }

        // 2. Filtrelenmiş ve Sayfalanmış Logları Getirme (Admin Paneli İçin)
        public async Task<PagedResponseDto<LogListDto>> GetLogsAsync(LogFilterDto filter)
        {
            var query = _context.Loglar.AsNoTracking().AsQueryable();

            // KULLANICI FİLTRESİ
            if (!string.IsNullOrWhiteSpace(filter.KullaniciId))
            {
                query = query.Where(l => l.KullaniciId == filter.KullaniciId);
            }

            // İŞLEM TİPİ FİLTRESİ (Giriş, Taşınmaz Ekleme vb.)
            if (!string.IsNullOrWhiteSpace(filter.IslemTipi))
            {
                query = query.Where(l => l.IslemTipi == filter.IslemTipi);
            }

            // DURUM FİLTRESİ (Basarili, Basarisiz)
            if (!string.IsNullOrWhiteSpace(filter.Durum))
            {
                query = query.Where(l => l.Durum == filter.Durum);
            }

            // BAŞLANGIÇ TARİHİ FİLTRESİ
            if (filter.BaslangicTarihi.HasValue)
            {
                var baslangicUtc = DateTime.SpecifyKind(filter.BaslangicTarihi.Value.Date, DateTimeKind.Utc);
                query = query.Where(l => l.Tarih >= baslangicUtc);
            }

            // BİTİŞ TARİHİ FİLTRESİ (Günün sonuna kadar: 23:59:59)
            if (filter.BitisTarihi.HasValue)
            {
                var bitisUtc = DateTime.SpecifyKind(filter.BitisTarihi.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
                query = query.Where(l => l.Tarih <= bitisUtc);
            }

            // IP ADRESİ FİLTRESİ
            if (!string.IsNullOrWhiteSpace(filter.IpAdresi))
            {
                var ip = filter.IpAdresi.Trim().ToLower();
                query = query.Where(l => l.IpAdresi != null && l.IpAdresi.ToLower().Contains(ip));
            }

            // SERBEST ARAMA (Açıklama, Email veya IP içinde)
            if (!string.IsNullOrWhiteSpace(filter.AramaMetni))
            {
                var arama = filter.AramaMetni.Trim().ToLower();
                query = query.Where(l => l.Aciklama.ToLower().Contains(arama) ||
                                         (l.KullaniciEmail != null && l.KullaniciEmail.ToLower().Contains(arama)) ||
                                         (l.IpAdresi != null && l.IpAdresi.ToLower().Contains(arama)));
            }

            // TOPLAM KAYIT SAYISI
            int totalCount = await query.CountAsync();

            // EN YENİ LOG EN ÜSTTE OLACAK ŞEKİLDE SAYFALAMA
            var loglar = await query
                .OrderByDescending(l => l.Tarih)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            // Kullanıcı İsim Haritasını Hazırlıyoruz (ID -> Ad Soyad ve Email -> Ad Soyad eşleştirmesi)
            var kullanicilar = await _context.Kullanicilar.AsNoTracking().ToListAsync();
            var kullaniciMapById = kullanicilar.ToDictionary(k => k.Id.ToString().ToLower(), k => k.AdSoyad);
            var kullaniciMapByEmail = kullanicilar.ToDictionary(k => k.Email.ToLower(), k => k.AdSoyad);

            var dtoList = loglar.Select(l =>
            {
                string kId = (l.KullaniciId ?? "").ToLower().Trim();
                string kEmail = (l.KullaniciEmail ?? "").ToLower().Trim();
                string ad = "Sistem / Anonim";

                if (!string.IsNullOrEmpty(kId) && kullaniciMapById.TryGetValue(kId, out var bulunanAd1))
                {
                    ad = bulunanAd1;
                }
                else if (!string.IsNullOrEmpty(kEmail) && kullaniciMapByEmail.TryGetValue(kEmail, out var bulunanAd2))
                {
                    ad = bulunanAd2;
                }

                return new LogListDto
                {
                    Id = l.Id,
                    KullaniciId = l.KullaniciId,
                    KullaniciEmail = l.KullaniciEmail,
                    KullaniciAdi = ad,
                    IslemTipi = l.IslemTipi,
                    Aciklama = l.Aciklama,
                    Durum = l.Durum,
                    IpAdresi = l.IpAdresi,
                    Tarih = l.Tarih
                };
            }).ToList();

            return new PagedResponseDto<LogListDto>
            {
                Data = dtoList,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize),
                CurrentPage = filter.PageNumber
            };
        }
    }
}