using Microsoft.EntityFrameworkCore;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using REMS.API.Data;
using REMS.API.DTOs.Property;
using REMS.API.Interfaces;
using REMS.API.Entities;

namespace REMS.API.Services
{
    public class PropertyService : IPropertyService
    {
        private readonly RemsDbContext _context;

        public PropertyService(RemsDbContext context)
        {
            _context = context;
        }

        // 1. METOT: Taşınmaz Ekleme
        public async Task<bool> AddPropertyAsync(PropertyCreateDto model)
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

                // Entity nesnemizi oluşturuyoruz
                var yeniTasinmaz = new Tasinmaz 
                {
                    Ad = model.Ad,
                    Aciklama = model.Aciklama,
                    MahalleId = model.MahalleId,
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
        } // <-- AddPropertyAsync METODU BURADA BİTİYOR

        // 2. METOT: Taşınmazları Listeleme
        public async Task<IEnumerable<PropertyListDto>> GetAllPropertiesAsync()
        {
            // 1. Veritabanından tüm taşınmazları çekiyoruz
            var tasinmazlar = await _context.Tasinmazlar.ToListAsync();
            
            // C# tip güvenliği için 'Ne Listesi' olduğunu belirtiyoruz
            var dtoList = new List<PropertyListDto>(); 

            foreach (var item in tasinmazlar)
            {
                var dto = new PropertyListDto
                {
                    Id = item.Id,
                    Ad = item.Ad,
                    Aciklama = item.Aciklama,
                    MahalleId = item.MahalleId,
                    Koordinatlar = new List<double[]>() // Array(Dizi) listesi olduğunu belirttik
                };

                // 2. Geometri Dönüşümü: Poligonu tekrar koordinat dizisine çeviriyoruz
                if (item.Sinir != null && item.Sinir.ExteriorRing != null)
                {
                    // ExteriorRing: Bir poligonun dış hatlarını (çizgisini) temsil eder
                    foreach (var coordinate in item.Sinir.ExteriorRing.Coordinates)
                    {
                        dto.Koordinatlar.Add(new double[] { coordinate.X, coordinate.Y });
                    }
                }

                dtoList.Add(dto);
            }

            return dtoList;
        } // <-- GetAllPropertiesAsync METODU BURADA BİTİYOR
    }
}