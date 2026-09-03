using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using REMS.API.Data;
using REMS.API.DTOs;
using REMS.API.DTOs.Common;
using REMS.API.DTOs.Property;
using REMS.API.Entities;
using REMS.API.Interfaces;
using REMS.API.Helpers;
using System.IO;

namespace REMS.API.Services
{
    public class TasinmazService : ITasinmazService
    {
        private readonly RemsDbContext _context;

        public TasinmazService(RemsDbContext context)
        {
            _context = context;
        }

        public async Task<int> AddPropertyAsync(TasinmazCreateDto model)
        {
            bool mukerrerVarMi = await _context.Tasinmazlar.AnyAsync(t =>
                t.MahalleId == model.MahalleId &&
                t.AdaNo.ToLower() == model.AdaNo.Trim().ToLower() &&
                t.ParselNo.ToLower() == model.ParselNo.Trim().ToLower());

            if (mukerrerVarMi)
            {
                throw new InvalidOperationException($"Seçilen mahallede {model.AdaNo}/{model.ParselNo} Ada/Parsel numarasına sahip bir taşınmaz sistemde zaten kayıtlıdır.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var polygon = GeometryHelper.KoordinatlardanPoligonUret(model.Koordinatlar);

                var yeniTasinmaz = new Tasinmaz
                {
                    KullaniciId = model.KullaniciId,
                    MahalleId = model.MahalleId,
                    AdaNo = model.AdaNo,
                    ParselNo = model.ParselNo,
                    Adres = model.Adres,
                    TasinmazTipi = model.TasinmazTipi,
                    AlanM2 = model.AlanM2 ?? 0,
                    ResimUrl = string.IsNullOrWhiteSpace(model.ResimUrl) ? GetDefaultImageUrl(model.TasinmazTipi) : model.ResimUrl,
                    Sinir = polygon
                };

                await _context.Tasinmazlar.AddAsync(yeniTasinmaz);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return yeniTasinmaz.Id;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<IEnumerable<TasinmazListDto>> GetAllPropertiesAsync()
        {
            var tasinmazlar = await _context.Tasinmazlar
                .Include(t => t.Mahalle)
                    .ThenInclude(m => m.Ilce)
                        .ThenInclude(i => i.Il)
                .ToListAsync();

            return tasinmazlar.Select(item => EntityToDto(item)).ToList();
        }

        public async Task<TasinmazListDto?> GetPropertyByIdAsync(int id)
        {
            var item = await _context.Tasinmazlar
                .Include(t => t.Mahalle)
                    .ThenInclude(m => m.Ilce)
                        .ThenInclude(i => i.Il)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (item == null) return null;

            return EntityToDto(item);
        }

        // Akıllı Güncelleme ve Fark (Diff) Tespiti
        public async Task<DTOs.Tasinmaz.UpdateResultDto> UpdatePropertyAsync(TasinmazUpdateDto model)
        {
            var tasinmaz = await _context.Tasinmazlar.FirstOrDefaultAsync(x => x.Id == model.Id);
            if (tasinmaz == null)
            {
                return new DTOs.Tasinmaz.UpdateResultDto
                {
                    Success = false,
                    HasChanges = false,
                    Message = "Güncellenecek taşınmaz bulunamadı."
                };
            }

            // Mükerrer Kontrolü: Yalnızca Mahalle, Ada veya Parsel değiştirildiyse kontrol edilir
            bool adaDegisti = !string.Equals(tasinmaz.AdaNo?.Trim(), model.AdaNo?.Trim(), StringComparison.OrdinalIgnoreCase);
            bool parselDegisti = !string.Equals(tasinmaz.ParselNo?.Trim(), model.ParselNo?.Trim(), StringComparison.OrdinalIgnoreCase);
            bool mahalleDegisti = model.MahalleId > 0 && tasinmaz.MahalleId != model.MahalleId;

            if (adaDegisti || parselDegisti || mahalleDegisti)
            {
                var hedefMahalleId = model.MahalleId > 0 ? model.MahalleId : tasinmaz.MahalleId;
                var hedefAdaNo = (model.AdaNo ?? tasinmaz.AdaNo ?? "").Trim().ToLower();
                var hedefParselNo = (model.ParselNo ?? tasinmaz.ParselNo ?? "").Trim().ToLower();

                bool mukerrerVarMi = await _context.Tasinmazlar.AnyAsync(t =>
                    t.Id != model.Id &&
                    t.MahalleId == hedefMahalleId &&
                    t.AdaNo.ToLower() == hedefAdaNo &&
                    t.ParselNo.ToLower() == hedefParselNo);

                if (mukerrerVarMi)
                {
                    throw new InvalidOperationException($"Seçilen mahallede {model.AdaNo ?? tasinmaz.AdaNo}/{model.ParselNo ?? tasinmaz.ParselNo} Ada/Parsel numarasına sahip başka bir taşınmaz zaten kayıtlıdır.");
                }
            }

            // ALAN BAZLI FARKLARI TESPİT ET (DIFF LİSTESİ)
            var degisiklikler = new List<string>();

            if (!string.Equals(tasinmaz.AdaNo?.Trim(), model.AdaNo?.Trim(), StringComparison.OrdinalIgnoreCase))
                degisiklikler.Add($"Ada: '{tasinmaz.AdaNo}' -> '{model.AdaNo}'");

            if (!string.Equals(tasinmaz.ParselNo?.Trim(), model.ParselNo?.Trim(), StringComparison.OrdinalIgnoreCase))
                degisiklikler.Add($"Parsel: '{tasinmaz.ParselNo}' -> '{model.ParselNo}'");

            if (model.MahalleId > 0 && tasinmaz.MahalleId != model.MahalleId)
                degisiklikler.Add("Mahalle Değişti");

            if (!string.Equals(tasinmaz.Adres?.Trim(), model.Adres?.Trim(), StringComparison.OrdinalIgnoreCase))
                degisiklikler.Add($"Adres: '{tasinmaz.Adres}' -> '{model.Adres}'");

            if (!string.Equals(tasinmaz.TasinmazTipi?.Trim(), model.TasinmazTipi?.Trim(), StringComparison.OrdinalIgnoreCase))
                degisiklikler.Add($"Tip: '{tasinmaz.TasinmazTipi}' -> '{model.TasinmazTipi}'");

            if (model.AlanM2.HasValue && Math.Abs((tasinmaz.AlanM2 ?? 0) - model.AlanM2.Value) > 0.001m)
                degisiklikler.Add($"Alan: '{tasinmaz.AlanM2}' -> '{model.AlanM2.Value}' m²");

            var dbResim = (tasinmaz.ResimUrl ?? "").Trim();
            var yeniResim = (model.ResimUrl ?? "").Trim();
            var defaultResim = GetDefaultImageUrl(tasinmaz.TasinmazTipi).Trim();

            bool resimAyni = string.Equals(dbResim, yeniResim, StringComparison.OrdinalIgnoreCase) ||
                             (string.IsNullOrEmpty(dbResim) && string.Equals(yeniResim, defaultResim, StringComparison.OrdinalIgnoreCase)) ||
                             (string.IsNullOrEmpty(yeniResim) && string.Equals(dbResim, defaultResim, StringComparison.OrdinalIgnoreCase));

            if (!resimAyni && !string.IsNullOrEmpty(yeniResim))
            {
                degisiklikler.Add("Fotoğraf güncellendi");
            }

            // 1. DURUM: HİÇBİR DEĞİŞİKLİK YOKSA VERİTABANINA DOKUNMA!
            if (degisiklikler.Count == 0)
            {
                return new DTOs.Tasinmaz.UpdateResultDto
                {
                    Success = true,
                    HasChanges = false,
                    Message = "Herhangi bir değişiklik yapılmadı."
                };
            }

            // 2. DURUM: DEĞİŞİKLİKLERİ UYGULA VE KAYDET
            tasinmaz.KullaniciId = model.KullaniciId?.ToString();
            tasinmaz.MahalleId = model.MahalleId;
            tasinmaz.AdaNo = model.AdaNo?.Trim();
            tasinmaz.ParselNo = model.ParselNo?.Trim();
            tasinmaz.Adres = model.Adres?.Trim();
            tasinmaz.TasinmazTipi = model.TasinmazTipi?.Trim();
            tasinmaz.AlanM2 = model.AlanM2;

            if (!string.IsNullOrWhiteSpace(model.ResimUrl))
            {
                tasinmaz.ResimUrl = model.ResimUrl.Trim();
            }

            if (model.Koordinatlar != null && model.Koordinatlar.Count >= 3)
            {
                tasinmaz.Sinir = GeometryHelper.KoordinatlardanPoligonUret(model.Koordinatlar);
            }

            await _context.SaveChangesAsync();

            return new DTOs.Tasinmaz.UpdateResultDto
            {
                Success = true,
                HasChanges = true,
                DiffSummary = string.Join(", ", degisiklikler),
                Message = "Taşınmaz başarıyla güncellendi."
            };
        }

        public async Task<bool> DeletePropertyAsync(int id)
        {
            var tasinmaz = await _context.Tasinmazlar.FirstOrDefaultAsync(x => x.Id == id);
            if (tasinmaz == null) return false;

            _context.Tasinmazlar.Remove(tasinmaz);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeletePropertiesAsync(List<int> ids)
        {
            if (ids == null || ids.Count == 0) return false;

            var silinecekler = await _context.Tasinmazlar.Where(x => ids.Contains(x.Id)).ToListAsync();
            if (silinecekler.Count == 0) return false;

            _context.Tasinmazlar.RemoveRange(silinecekler);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<TasinmazPagedResponseDto> GetFilteredTasinmazlarAsync(TasinmazFilterDto filter)
        {
            try
            {
                var query = _context.Tasinmazlar
                    .AsNoTracking()
                    .Include(t => t.Mahalle)
                        .ThenInclude(m => m.Ilce)
                            .ThenInclude(i => i.Il)
                    .AsQueryable();

                if (filter.IlId.HasValue)
                    query = query.Where(t => t.Mahalle.Ilce.IlId == filter.IlId.Value);

                if (filter.IlceId.HasValue)
                    query = query.Where(t => t.Mahalle.IlceId == filter.IlceId.Value);

                if (filter.MahalleId.HasValue)
                    query = query.Where(t => t.MahalleId == filter.MahalleId.Value);

                if (!string.IsNullOrWhiteSpace(filter.AdaNo))
                {
                    var cleanAda = filter.AdaNo.Trim();
                    if (cleanAda.Contains('/') || cleanAda.Contains('-'))
                    {
                        var parts = cleanAda.Split(new[] { '/', '-' }, StringSplitOptions.RemoveEmptyEntries);
                        if (parts.Length >= 2)
                        {
                            var adaPart = parts[0].Trim();
                            var parselPart = parts[1].Trim();
                            query = query.Where(t => t.AdaNo.Contains(adaPart) && t.ParselNo.Contains(parselPart));
                        }
                        else if (parts.Length == 1)
                        {
                            var tekParca = parts[0].Trim();
                            query = query.Where(t => t.AdaNo.Contains(tekParca) || t.ParselNo.Contains(tekParca));
                        }
                    }
                    else if (string.IsNullOrWhiteSpace(filter.ParselNo))
                    {
                        query = query.Where(t => t.AdaNo.Contains(cleanAda) || t.ParselNo.Contains(cleanAda));
                    }
                    else
                    {
                        query = query.Where(t => t.AdaNo.Contains(cleanAda));
                    }
                }

                if (!string.IsNullOrWhiteSpace(filter.ParselNo))
                    query = query.Where(t => t.ParselNo.Contains(filter.ParselNo.Trim()));

                if (!string.IsNullOrWhiteSpace(filter.Adres))
                    query = query.Where(t => t.Adres.Contains(filter.Adres));

                if (!string.IsNullOrWhiteSpace(filter.TasinmazTipi))
                    query = query.Where(t => t.TasinmazTipi == filter.TasinmazTipi);

                if (!string.IsNullOrWhiteSpace(filter.KullaniciId))
                    query = query.Where(t => t.KullaniciId != null && t.KullaniciId.ToLower() == filter.KullaniciId.ToLower());

                int totalCount = await query.CountAsync();
                decimal totalAreaM2 = await query.SumAsync(t => t.AlanM2 ?? 0);
                int konutCount = await query.CountAsync(t => t.TasinmazTipi == "Konut");
                int arsaCount = await query.CountAsync(t => t.TasinmazTipi == "Arsa");
                int binaCount = await query.CountAsync(t => t.TasinmazTipi == "Bina");

                var topCities = await query
                    .Where(t => t.Mahalle != null && t.Mahalle.Ilce != null && t.Mahalle.Ilce.Il != null)
                    .GroupBy(t => t.Mahalle.Ilce.Il.Ad)
                    .Select(g => new { IlAdi = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(3)
                    .ToListAsync();

                string topCitiesSummary = topCities.Any()
                    ? string.Join(", ", topCities.Select(c => $"{c.IlAdi} ({c.Count})"))
                    : "Kayıt Yok";

                var tasinmazlar = await query
                    .OrderByDescending(t => t.Id)
                    .Skip((filter.PageNumber - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .ToListAsync();

                var kullaniciListesi = await _context.Kullanicilar.AsNoTracking().ToListAsync();
                var kullaniciMap = kullaniciListesi.ToDictionary(k => k.Id.ToString().ToLower(), k => k.AdSoyad);

                var dtoList = tasinmazlar.Select(item =>
                {
                    string kId = (item.KullaniciId ?? "").ToLower().Trim();
                    string sahipAdi = kullaniciMap.TryGetValue(kId, out var ad) ? ad : "Bilinmiyor";
                    return EntityToDto(item, sahipAdi);
                }).ToList();

                return new TasinmazPagedResponseDto
                {
                    Data = dtoList,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize),
                    CurrentPage = filter.PageNumber,
                    TotalAreaM2 = totalAreaM2,
                    KonutCount = konutCount,
                    ArsaCount = arsaCount,
                    BinaCount = binaCount,
                    TopCitiesSummary = topCitiesSummary
                };
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Taşınmazlar listelenirken hata oluştu.", ex);
            }
        }

        private static TasinmazListDto EntityToDto(Tasinmaz item, string? sahipAdi = null)
        {
            return new TasinmazListDto
            {
                Id = item.Id,
                KullaniciId = item.KullaniciId,
                KullaniciAdi = sahipAdi,
                MahalleId = item.MahalleId,
                IlAdi = item.Mahalle?.Ilce?.Il?.Ad ?? "",
                IlceAdi = item.Mahalle?.Ilce?.Ad ?? "",
                MahalleAdi = item.Mahalle?.Ad ?? "",
                AdaNo = item.AdaNo,
                ParselNo = item.ParselNo,
                Adres = item.Adres,
                TasinmazTipi = item.TasinmazTipi,
                AlanM2 = item.AlanM2,
                ResimUrl = string.IsNullOrWhiteSpace(item.ResimUrl) ? GetDefaultImageUrl(item.TasinmazTipi) : item.ResimUrl,
                Koordinatlar = GeometryHelper.PoligondanDiziKoordinatAl(item.Sinir)
            };
        }

        // SRS: Fotoğraf Yükleme (JPEG/PNG, max 100 MB, yerel klasöre kayıt)
        public async Task<string> ResimYukleAsync(int tasinmazId, IFormFile dosya)
        {
            var tasinmaz = await _context.Tasinmazlar.FirstOrDefaultAsync(x => x.Id == tasinmazId);
            if (tasinmaz == null)
            {
                throw new InvalidOperationException($"ID'si {tasinmazId} olan taşınmaz bulunamadı.");
            }

            if (dosya == null || dosya.Length == 0)
            {
                throw new InvalidOperationException("Lütfen yüklenecek bir fotoğraf dosyası seçiniz.");
            }

            // SRS Kuralı: Maksimum 100 MB dosya boyutu kontrolü
            const long maxBoyut = 100 * 1024 * 1024;
            if (dosya.Length > maxBoyut)
            {
                throw new InvalidOperationException("Fotoğraf dosya boyutu 100 MB sınırını aşamaz.");
            }

            // SRS Kuralı: Sadece JPEG ve PNG formatları
            var uzanti = Path.GetExtension(dosya.FileName).ToLowerInvariant();
            var izinVerilenUzantilar = new[] { ".jpg", ".jpeg", ".png" };
            if (!izinVerilenUzantilar.Contains(uzanti))
            {
                throw new InvalidOperationException("Yalnızca JPEG (.jpg, .jpeg) ve PNG (.png) formatındaki dosyalar yüklenebilir.");
            }

            var uploadsKlasorYolu = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsKlasorYolu))
            {
                Directory.CreateDirectory(uploadsKlasorYolu);
            }

            var benzersizDosyaAdi = $"tasinmaz_{tasinmazId}_{Guid.NewGuid():N}{uzanti}";
            var tamFizikselYol = Path.Combine(uploadsKlasorYolu, benzersizDosyaAdi);

            using (var stream = new FileStream(tamFizikselYol, FileMode.Create))
            {
                await dosya.CopyToAsync(stream);
            }

            var dosyaErisimYolu = $"/uploads/{benzersizDosyaAdi}";
            tasinmaz.ResimUrl = dosyaErisimYolu;
            await _context.SaveChangesAsync();

            return dosyaErisimYolu;
        }

        private static string GetDefaultImageUrl(string? tip)
        {
            return (tip?.Trim().ToLower()) switch
            {
                "arsa" => "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
                "bina" => "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
                _ => "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80"
            };
        }
    }
}