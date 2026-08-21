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

namespace REMS.API.Services
{
    public class TasinmazService : ITasinmazService
    {
        private readonly RemsDbContext _context;

        public TasinmazService(RemsDbContext context)
        {
            _context = context;
        }

        // 1. METOT: Taşınmaz Ekleme
        public async Task<bool> AddPropertyAsync(TasinmazCreateDto model)
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
                    Sinir = polygon
                };

                await _context.Tasinmazlar.AddAsync(yeniTasinmaz);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return false;
            }
        }

        // 2. METOT: Taşınmazları İl, İlçe ve Mahalle Adlarıyla Birlikte DTO ile Listeleme
        public async Task<IEnumerable<TasinmazListDto>> GetAllPropertiesAsync()
        {
            var tasinmazlar = await _context.Tasinmazlar
                .Include(t => t.Mahalle)
                    .ThenInclude(m => m.Ilce)
                        .ThenInclude(i => i.Il)
                .ToListAsync();

            return tasinmazlar.Select(item => EntityToDto(item)).ToList();
        }

        // 3. METOT: ID ile Kayıt Bulma
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

        // 4. METOT: Güncelleme
        public async Task<bool> UpdatePropertyAsync(TasinmazUpdateDto model)
        {
            var tasinmaz = await _context.Tasinmazlar.FirstOrDefaultAsync(x => x.Id == model.Id);
            if (tasinmaz == null) return false;

            bool mukerrerVarMi = await _context.Tasinmazlar.AnyAsync(t =>
                t.Id != model.Id &&
                t.MahalleId == model.MahalleId &&
                t.AdaNo.ToLower() == model.AdaNo.Trim().ToLower() &&
                t.ParselNo.ToLower() == model.ParselNo.Trim().ToLower());

            if (mukerrerVarMi)
            {
                throw new InvalidOperationException($"Seçilen mahallede {model.AdaNo}/{model.ParselNo} Ada/Parsel numarasına sahip başka bir taşınmaz zaten kayıtlıdır.");
            }

            tasinmaz.KullaniciId = model.KullaniciId?.ToString();
            tasinmaz.MahalleId = model.MahalleId;
            tasinmaz.AdaNo = model.AdaNo;
            tasinmaz.ParselNo = model.ParselNo;
            tasinmaz.Adres = model.Adres;
            tasinmaz.TasinmazTipi = model.TasinmazTipi;
            tasinmaz.AlanM2 = model.AlanM2;
            tasinmaz.Sinir = GeometryHelper.KoordinatlardanPoligonUret(model.Koordinatlar);

            await _context.SaveChangesAsync();
            return true;
        }

        // 5. METOT: Silme
        public async Task<bool> DeletePropertyAsync(int id)
        {
            var tasinmaz = await _context.Tasinmazlar.FirstOrDefaultAsync(x => x.Id == id);
            if (tasinmaz == null) return false;

            _context.Tasinmazlar.Remove(tasinmaz);
            await _context.SaveChangesAsync();
            return true;
        }

        // 6. METOT: Toplu Silme
        public async Task<bool> DeletePropertiesAsync(List<int> ids)
        {
            if (ids == null || ids.Count == 0) return false;

            var silinecekler = await _context.Tasinmazlar.Where(x => ids.Contains(x.Id)).ToListAsync();
            if (silinecekler.Count == 0) return false;

            _context.Tasinmazlar.RemoveRange(silinecekler);
            await _context.SaveChangesAsync();
            return true;
        }

        // 7. METOT: Filtrelenmiş ve Sayfalanmış Liste
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
                    query = query.Where(t => t.AdaNo.Contains(filter.AdaNo));

                if (!string.IsNullOrWhiteSpace(filter.ParselNo))
                    query = query.Where(t => t.ParselNo.Contains(filter.ParselNo));

                if (!string.IsNullOrWhiteSpace(filter.Adres))
                    query = query.Where(t => t.Adres.Contains(filter.Adres));

                if (!string.IsNullOrWhiteSpace(filter.TasinmazTipi))
                    query = query.Where(t => t.TasinmazTipi == filter.TasinmazTipi);

                if (!string.IsNullOrWhiteSpace(filter.KullaniciId))
                    query = query.Where(t => t.KullaniciId == filter.KullaniciId);

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

        // ORTAK DTO DÖNÜŞTÜRÜCÜ (3 farklı yerdeki kod tekrarını tek metoda topladı)
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
                Koordinatlar = GeometryHelper.PoligondanDiziKoordinatAl(item.Sinir)
            };
        }
    }
}