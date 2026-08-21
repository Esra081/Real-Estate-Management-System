using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using REMS.API.Data;
using REMS.API.DTOs.AlanAnalizi;
using REMS.API.Entities;
using REMS.API.Helpers;
using REMS.API.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace REMS.API.Services
{
    public class AlanAnaliziService : IAlanAnaliziService
    {
        private readonly RemsDbContext _context;
        private readonly ILogService _logService;

        public AlanAnaliziService(RemsDbContext context, ILogService logService)
        {
            _context = context;
            _logService = logService;
        }

        // 1. METOT: Kullanıcının haritada çizdiği A, B, C poligonlarını kaydeder
        public async Task<(bool Success, string Message)> KaydetGeometrilerAsync(List<PoligonDto> geometriler, string? kullaniciId)
        {
            if (geometriler == null || !geometriler.Any())
                return (false, "Kaydedilecek geometri bulunamadı.");

            try
            {
                foreach (var dto in geometriler)
                {
                    if (dto.Koordinatlar == null || dto.Koordinatlar.Count < 3)
                        continue;

                    // 1. Koordinatları NTS Poligonuna çevir ve m² hesapla
                    var polygon = GeometryHelper.KoordinatlardanPoligonUret(dto.Koordinatlar);
                    var alanM2 = GeometryHelper.HesaplaM2(polygon);

                    // 2. Bu kullanıcı için bu etiketle (örn: 'A') daha önce kayıt var mı?
                    var mevcut = await _context.AlanAnalizGeometrileri
                        .FirstOrDefaultAsync(x => x.KullaniciId == kullaniciId && x.Etiket == dto.Etiket);

                    if (mevcut != null)
                    {
                        // Varsa güncelle (Update)
                        mevcut.Geometri = polygon;
                        mevcut.AlanM2 = alanM2;
                        mevcut.OlusturmaTarihi = DateTime.UtcNow;
                    }
                    else
                    {
                        // Yoksa yeni kayıt ekle (Insert)
                        var yeni = new AlanAnalizGeometri
                        {
                            KullaniciId = kullaniciId,
                            Etiket = dto.Etiket,
                            Geometri = polygon,
                            AlanM2 = alanM2,
                            OlusturmaTarihi = DateTime.UtcNow
                        };
                        await _context.AlanAnalizGeometrileri.AddAsync(yeni);
                    }
                }

                // 3. Değişiklikleri veritabanına yaz
                await _context.SaveChangesAsync();

                // 4. Log tablosuna kayıt at
                await _logService.LogAsync("Alan Analizi", $"{geometriler.Count} adet geometri kaydedildi/güncellendi.", "Basarili", kullaniciId);

                return (true, "Geometriler başarıyla kaydedildi.");
            }
            catch (Exception ex)
            {
                await _logService.LogAsync("Alan Analizi", $"Kayıt hatası: {ex.Message}", "Basarisiz", kullaniciId);
                return (false, $"Kaydetme hatası: {ex.Message}");
            }
        }

        // 2. METOT: Veritabanında kayıtlı A, B, C poligonlarını getirir (Auto-Select)
        public async Task<List<PoligonDto>> GetAutoSelectGeometrilerAsync(string? kullaniciId)
        {
            // 1. Kullanıcının sadece A, B ve C etiketli poligonlarını veritabanından bul
            var liste = await _context.AlanAnalizGeometrileri
                .Where(x => (kullaniciId == null || x.KullaniciId == kullaniciId) &&
                            (x.Etiket == "A" || x.Etiket == "B" || x.Etiket == "C"))
                .ToListAsync();

            // 2. Veritabanındaki PostGIS geometrilerini Frontend'in anlayacağı koordinat dizisine (DTO) çevir
            return liste.Select(g => new PoligonDto
            {
                Etiket = g.Etiket,
                AlanM2 = g.AlanM2 ?? GeometryHelper.HesaplaM2(g.Geometri),
                Koordinatlar = GeometryHelper.PoligondanKoordinatlariAl(g.Geometri)
            }).ToList();
        }


        // 3. METOT: İki poligonun kesişimini hesaplar (A ∩ B) - DB'ye kaydedilmez
        public async Task<AlanAnalizSonucDto> KesisimHesaplaAsync(string p1, string p2, List<PoligonDto>? geometriler, string? kullaniciId)
        {
            // 1. İki poligonu bul (çizimden veya veritabanından)
            var poly1 = await PoligonGetirAsync(p1, geometriler, kullaniciId);
            var poly2 = await PoligonGetirAsync(p2, geometriler, kullaniciId);

            if (poly1 == null || poly2 == null)
            {
                return new AlanAnalizSonucDto
                {
                    Basarili = false,
                    Mesaj = $"{p1} veya {p2} poligonu bulunamadı. Lütfen çizim yapın veya Auto-Select kullanın."
                };
            }

            // 2. NetTopologySuite Kesişim Motoru (Intersection)
            var kesisimGeom = poly1.Intersection(poly2);

            // 3. Kesişen bir alan var mı?
            if (kesisimGeom == null || kesisimGeom.IsEmpty)
            {
                return new AlanAnalizSonucDto
                {
                    Basarili = false,
                    Mesaj = $"{p1} ve {p2} poligonları arasında kesişim (ortak alan) bulunamadı."
                };
            }

            // 4. Koordinatları çıkar ve m² alanını hesapla
            var koordinatlar = GeometryHelper.PoligondanKoordinatlariAl(kesisimGeom);
            var alanM2 = GeometryHelper.HesaplaM2(kesisimGeom);

            // 5. Log kaydı at
            await _logService.LogAsync("Alan Analizi", $"{p1} ∩ {p2} kesişimi hesaplandı ({alanM2} m²).", "Basarili", kullaniciId);

            return new AlanAnalizSonucDto
            {
                Basarili = true,
                Mesaj = $"{p1} ve {p2} kesişimi başarıyla hesaplandı.",
                IslemTipi = $"{p1} ∩ {p2}",
                SonucEtiketi = "Kesişim",
                AlanM2 = alanM2,
                Koordinatlar = koordinatlar
            };
        }

        // YARDIMCI METOT: İstenen etiketli poligonu (örn: 'A') önce gelen çizimlerden arar, yoksa DB'den çeker
        private async Task<Polygon?> PoligonGetirAsync(string etiket, List<PoligonDto>? geometriler, string? kullaniciId)
        {
            var dto = geometriler?.FirstOrDefault(g => g.Etiket.Equals(etiket, StringComparison.OrdinalIgnoreCase));
            if (dto != null && dto.Koordinatlar != null && dto.Koordinatlar.Count >= 3)
            {
                return GeometryHelper.KoordinatlardanPoligonUret(dto.Koordinatlar);
            }

            var dbGeom = await _context.AlanAnalizGeometrileri
                .FirstOrDefaultAsync(x => (kullaniciId == null || x.KullaniciId == kullaniciId) && x.Etiket == etiket);

            return dbGeom?.Geometri as Polygon;
        }

        // 4. METOT: Poligonların birleşimini hesaplar (A ∪ B -> D veya A ∪ B ∪ C -> E) ve DB'ye KAYDEDER
        public async Task<AlanAnalizSonucDto> BirlesimHesaplaAsync(List<string> etiketler, List<PoligonDto>? geometriler, string? kullaniciId)
        {
            if (etiketler == null || etiketler.Count < 2)
            {
                return new AlanAnalizSonucDto { Basarili = false, Mesaj = "Birleşim için en az 2 poligon seçilmelidir." };
            }

            // 1. Birleştirilecek poligonları listeye topla
            var poligonlar = new List<Geometry>();
            foreach (var etiket in etiketler)
            {
                var poly = await PoligonGetirAsync(etiket, geometriler, kullaniciId);
                if (poly == null)
                {
                    return new AlanAnalizSonucDto { Basarili = false, Mesaj = $"{etiket} poligonu bulunamadı." };
                }
                poligonlar.Add(poly);
            }

            // 2. NetTopologySuite Birleşim Motoru (Union)
            Geometry birlesimGeom = poligonlar[0];
            for (int i = 1; i < poligonlar.Count; i++)
            {
                birlesimGeom = birlesimGeom.Union(poligonlar[i]);
            }

            // 3. Koordinatları çıkar ve yeni birleşik m² alanını hesapla
            var koordinatlar = GeometryHelper.PoligondanKoordinatlariAl(birlesimGeom);
            var alanM2 = GeometryHelper.HesaplaM2(birlesimGeom);

            // 4. 2'li birleşim -> "D", 3'lü birleşim -> "E" etiketi alır
            string sonucEtiketi = etiketler.Count == 2 ? "D" : "E";

            // 5. VERİTABANINA KAYDET (Kesişimden en büyük farkı burasıdır!)
            var mevcut = await _context.AlanAnalizGeometrileri
                .FirstOrDefaultAsync(x => x.KullaniciId == kullaniciId && x.Etiket == sonucEtiketi);

            if (mevcut != null)
            {
                mevcut.Geometri = birlesimGeom;
                mevcut.AlanM2 = alanM2;
                mevcut.OlusturmaTarihi = DateTime.UtcNow;
            }
            else
            {
                var yeni = new AlanAnalizGeometri
                {
                    KullaniciId = kullaniciId,
                    Etiket = sonucEtiketi,
                    Geometri = birlesimGeom,
                    AlanM2 = alanM2,
                    OlusturmaTarihi = DateTime.UtcNow
                };
                await _context.AlanAnalizGeometrileri.AddAsync(yeni);
            }

            await _context.SaveChangesAsync();

            // 6. Log kaydı at
            await _logService.LogAsync("Alan Analizi", $"{string.Join(" ∪ ", etiketler)} birleşimi oluşturuldu ({sonucEtiketi}: {alanM2} m²).", "Basarili", kullaniciId);

            return new AlanAnalizSonucDto
            {
                Basarili = true,
                Mesaj = $"{string.Join(" ∪ ", etiketler)} birleşimi başarıyla oluşturuldu ve '{sonucEtiketi}' olarak kaydedildi.",
                IslemTipi = string.Join(" ∪ ", etiketler),
                SonucEtiketi = sonucEtiketi,
                AlanM2 = alanM2,
                Koordinatlar = koordinatlar
            };
        }
    }
}
