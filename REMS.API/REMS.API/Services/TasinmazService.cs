using Microsoft.EntityFrameworkCore;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using REMS.API.Data;
using REMS.API.DTOs.Property;
using REMS.API.Interfaces;
using REMS.API.Entities;

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
            // İşlem Güvenliği (Transaction) Başlatılıyor
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var coordinates = new List<Coordinate>();

                // Frontend'den gelen listeyi NTS formatına çevir
                foreach (var nokta in model.Koordinatlar)
                {
                    coordinates.Add(new Coordinate(nokta[0], nokta[1]));
                }

                // KURAL: Poligonun başlangıç ve bitiş noktası aynı olmalıdır!
                if (!coordinates.First().Equals2D(coordinates.Last()))
                {
                    coordinates.Add(coordinates.First());
                }

                // SRID 4326: Dünya standartı (GPS/Google Maps) koordinat sistemi
                var geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
                var ring = geometryFactory.CreateLinearRing(coordinates.ToArray());
                var polygon = geometryFactory.CreatePolygon(ring);

                // YENİLENEN KISIM: Eski Ad ve Aciklama yerine yeni veritabanı sütunlarımızı bağladık
                var yeniTasinmaz = new Tasinmaz
                {
                    KullaniciId = model.KullaniciId,
                    MahalleId = model.MahalleId,
                    AdaNo = model.AdaNo,
                    ParselNo = model.ParselNo,
                    Adres = model.Adres,
                    TasinmazTipi = model.TasinmazTipi,
                    AlanM2 = model.AlanM2 ?? 0,
                    Sinir = polygon // Sayıları coğrafi bir alana dönüştürdük!
                };

                await _context.Tasinmazlar.AddAsync(yeniTasinmaz);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"Hata: {ex.Message}");
                return false;
            }
        }

        // 2. METOT: Taşınmazları İl, İlçe ve Mahalle Adlarıyla Birlikte DTO ile Listeleme
        public async Task<IEnumerable<TasinmazListDto>> GetAllPropertiesAsync()
        {
            // Include zinciri ile Mahalle -> İlçe -> İl verilerini beraber çekiyoruz
            var tasinmazlar = await _context.Tasinmazlar
                .Include(t => t.Mahalle)
                    .ThenInclude(m => m.Ilce)
                        .ThenInclude(i => i.Il)
                .ToListAsync();

            var dtoList = new List<TasinmazListDto>();

            foreach (var item in tasinmazlar)
            {
                var dto = new TasinmazListDto
                {
                    Id = item.Id,
                    KullaniciId = item.KullaniciId,
                    MahalleId = item.MahalleId,

                    MahalleAdi = item.Mahalle != null ? item.Mahalle.Ad : "",
                    IlceAdi = item.Mahalle != null && item.Mahalle.Ilce != null ? item.Mahalle.Ilce.Ad : "",
                    IlAdi = item.Mahalle != null && item.Mahalle.Ilce != null && item.Mahalle.Ilce.Il != null ? item.Mahalle.Ilce.Il.Ad : "",

                    AdaNo = item.AdaNo,
                    ParselNo = item.ParselNo,
                    Adres = item.Adres,
                    TasinmazTipi = item.TasinmazTipi,
                    AlanM2 = item.AlanM2,
                    Koordinatlar = new List<double[]>()
                };

                // Geometri Dönüşümü: Poligonu tekrar koordinat dizisine çeviriyoruz
                if (item.Sinir != null && item.Sinir.ExteriorRing != null)
                {
                    foreach (var coordinate in item.Sinir.ExteriorRing.Coordinates)
                    {
                        dto.Koordinatlar.Add(new double[] { coordinate.X, coordinate.Y });
                    }
                }

                dtoList.Add(dto);
            }

            return dtoList;
        }

        // 3. METOT: Standart Liste
        public async Task<IEnumerable<Tasinmaz>> GetAllAsync()
        {
            var tasinmazlar = await _context.Tasinmazlar.ToListAsync();
            return tasinmazlar;
        }

        // id ile kayıt bul
        public async Task<TasinmazListDto> GetPropertyByIdAsync(int id)
        {
            var item = await _context.Tasinmazlar
                .FirstOrDefaultAsync(x => x.Id == id);

            if (item == null)
            {
                return null;
            }

            var dto = new TasinmazListDto
            {
                Id = item.Id,
                KullaniciId = item.KullaniciId,
                MahalleId = item.MahalleId,
                AdaNo = item.AdaNo,
                ParselNo = item.ParselNo,
                Adres = item.Adres,
                TasinmazTipi = item.TasinmazTipi,
                AlanM2 = item.AlanM2,
                Koordinatlar = new List<double[]>()
            };

            if (item.Sinir != null && item.Sinir.ExteriorRing != null)
            {
                foreach (var coordinate in item.Sinir.ExteriorRing.Coordinates)
                {
                    dto.Koordinatlar.Add(
                        new double[] { coordinate.X, coordinate.Y }
                    );
                }
            }

            return dto;
        }

        public async Task<bool> UpdatePropertyAsync(TasinmazUpdateDto model)
        {
            var tasinmaz = await _context.Tasinmazlar
                .FirstOrDefaultAsync(x => x.Id == model.Id);

            if (tasinmaz == null)
            {
                return false;
            }

            tasinmaz.KullaniciId = model.KullaniciId.ToString();
            tasinmaz.MahalleId = model.MahalleId;
            tasinmaz.AdaNo = model.AdaNo;
            tasinmaz.ParselNo = model.ParselNo;
            tasinmaz.Adres = model.Adres;
            tasinmaz.TasinmazTipi = model.TasinmazTipi;
            tasinmaz.AlanM2 = model.AlanM2;

            var coordinates = new List<Coordinate>();

            foreach (var nokta in model.Koordinatlar)
            {
                coordinates.Add(new Coordinate(nokta[0], nokta[1]));
            }

            if (!coordinates.First().Equals2D(coordinates.Last()))
            {
                coordinates.Add(coordinates.First());
            }

            var geometryFactory =
                NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);

            var ring = geometryFactory.CreateLinearRing(coordinates.ToArray());
            var polygon = geometryFactory.CreatePolygon(ring);

            tasinmaz.Sinir = polygon;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeletePropertyAsync(int id)
        {
            var tasinmaz = await _context.Tasinmazlar
                .FirstOrDefaultAsync(x => x.Id == id);

            if (tasinmaz == null)
            {
                return false;
            }

            _context.Tasinmazlar.Remove(tasinmaz);

            await _context.SaveChangesAsync();

            return true;
        }
    }

}