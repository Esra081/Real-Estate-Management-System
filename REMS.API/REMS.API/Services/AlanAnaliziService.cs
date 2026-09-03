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

        public async Task<(bool Success, string Message)> KaydetGeometrilerAsync(List<PoligonDto> geometriler, string? kullaniciId)
        {
            if (geometriler == null || geometriler.Count == 0)
                return (false, "Kaydedilecek geometri bulunamadı.");

            try
            {
                foreach (var dto in geometriler)
                {
                    if (dto.Koordinatlar == null || dto.Koordinatlar.Count < 3)
                        continue;

                    var polygon = GeometryHelper.KoordinatlardanPoligonUret(dto.Koordinatlar);
                    var alanM2 = GeometryHelper.HesaplaM2(polygon);

                    var mevcut = await _context.AlanAnalizGeometrileri
                        .FirstOrDefaultAsync(x => x.KullaniciId == kullaniciId && x.Etiket == dto.Etiket);

                    if (mevcut != null)
                    {
                        mevcut.Geometri = polygon;
                        mevcut.AlanM2 = alanM2;
                        mevcut.OlusturmaTarihi = DateTime.UtcNow;
                    }
                    else
                    {
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

                await _context.SaveChangesAsync();

                await _logService.LogAsync("Alan Analizi", $"{geometriler.Count} adet geometri kaydedildi/güncellendi.", "Basarili", kullaniciId);

                return (true, "Geometriler başarıyla kaydedildi.");
            }
            catch (Exception ex)
            {
                await _logService.LogAsync("Alan Analizi", $"Kayıt hatası: {ex.Message}", "Basarisiz", kullaniciId);
                return (false, $"Kaydetme hatası: {ex.Message}");
            }
        }

        public async Task<List<PoligonDto>> GetAutoSelectGeometrilerAsync(string? kullaniciId)
        {
            var liste = await _context.AlanAnalizGeometrileri
                .Where(x => (kullaniciId == null || x.KullaniciId == kullaniciId) &&
                            (x.Etiket == "A" || x.Etiket == "B" || x.Etiket == "C"))
                .ToListAsync();

            return liste.Select(g => new PoligonDto
            {
                Etiket = g.Etiket,
                AlanM2 = g.AlanM2 ?? GeometryHelper.HesaplaM2(g.Geometri),
                Koordinatlar = GeometryHelper.PoligondanKoordinatlariAl(g.Geometri)
            }).ToList();
        }

        public async Task<AlanAnalizSonucDto> KesisimHesaplaAsync(string p1, string p2, List<PoligonDto>? geometriler, string? kullaniciId)
        {
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

            var kesisimGeom = poly1.Intersection(poly2);

            if (kesisimGeom == null || kesisimGeom.IsEmpty)
            {
                return new AlanAnalizSonucDto
                {
                    Basarili = false,
                    Mesaj = $"{p1} ve {p2} poligonları arasında kesişim (ortak alan) bulunamadı."
                };
            }

            var koordinatlar = GeometryHelper.PoligondanKoordinatlariAl(kesisimGeom);
            var alanM2 = GeometryHelper.HesaplaM2(kesisimGeom);

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

        public async Task<AlanAnalizSonucDto> BirlesimHesaplaAsync(List<string> etiketler, List<PoligonDto>? geometriler, string? kullaniciId)
        {
            if (etiketler == null || etiketler.Count < 2)
            {
                return new AlanAnalizSonucDto { Basarili = false, Mesaj = "Birleşim için en az 2 poligon seçilmelidir." };
            }

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

            Geometry birlesimGeom = poligonlar[0];
            for (int i = 1; i < poligonlar.Count; i++)
            {
                birlesimGeom = birlesimGeom.Union(poligonlar[i]);
            }

            var koordinatlar = GeometryHelper.PoligondanKoordinatlariAl(birlesimGeom);
            var cokluKoordinatlar = GeometryHelper.TumParcalariAl(birlesimGeom);
            var alanM2 = GeometryHelper.HesaplaM2(birlesimGeom);

            string sonucEtiketi = etiketler.Count == 2 ? "D" : "E";

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

            await _logService.LogAsync("Alan Analizi", $"{string.Join(" ∪ ", etiketler)} birleşimi oluşturuldu ({sonucEtiketi}: {alanM2} m²).", "Basarili", kullaniciId);

            return new AlanAnalizSonucDto
            {
                Basarili = true,
                Mesaj = $"{string.Join(" ∪ ", etiketler)} birleşimi başarıyla oluşturuldu ve '{sonucEtiketi}' olarak kaydedildi.",
                IslemTipi = string.Join(" ∪ ", etiketler),
                SonucEtiketi = sonucEtiketi,
                AlanM2 = alanM2,
                Koordinatlar = koordinatlar,
                CokluKoordinatlar = cokluKoordinatlar
            };
        }
    }
}
