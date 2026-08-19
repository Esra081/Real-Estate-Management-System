using ClosedXML.Excel;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using REMS.API.Data;
using REMS.API.Entities;
using REMS.API.Interfaces;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace REMS.API.Services
{
    public class ImportService : IImportService
    {
        private readonly RemsDbContext _context;

        public ImportService(RemsDbContext context)
        {
            _context = context;
        }

        public async Task<(bool Success, string Message, int Count)> ImportTasinmazlarFromExcelAsync(IFormFile file, string kullaniciId)
        {
            if (file == null || file.Length == 0)
                return (false, "Lütfen geçerli bir Excel dosyası seçin.", 0);

            if (!file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
                return (false, "Sadece .xlsx uzantılı Excel dosyaları desteklenmektedir.", 0);

            try
            {
                using var stream = file.OpenReadStream();
                using var workbook = new XLWorkbook(stream);
                var worksheet = workbook.Worksheets.FirstOrDefault();

                if (worksheet == null)
                    return (false, "Excel dosyasında geçerli bir çalışma sayfası bulunamadı.", 0);

                var geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
                var eklenecekTasinmazlar = new List<Tasinmaz>();

                var firstRow = worksheet.FirstRowUsed();
                var headers = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                if (firstRow != null)
                {
                    foreach (var cell in firstRow.CellsUsed())
                    {
                        var val = cell.GetString().Trim();
                        if (!string.IsNullOrEmpty(val))
                        {
                            headers[val] = cell.Address.ColumnNumber;
                        }
                    }
                }

                int GetCol(int fallbackIndex, params string[] candidates)
                {
                    foreach (var c in candidates)
                    {
                        if (headers.TryGetValue(c, out int colIndex))
                            return colIndex;
                    }
                    return fallbackIndex;
                }

                int colIl = GetCol(1, "İl", "Il", "City");
                int colIlce = GetCol(2, "İlçe", "Ilce", "District");
                int colMahalle = GetCol(3, "Mahalle", "Neighborhood");
                int colAda = GetCol(4, "Ada No", "Ada", "Parcel Number", "Parcel");
                int colParsel = GetCol(5, "Parsel No", "Parsel", "Lot Number", "Lot");
                int colTip = GetCol(6, "Taşınmaz Tipi", "Tasinmaz Tipi", "Tip", "Property Type");
                int colAlan = GetCol(7, "Alan (m²)", "Alan", "AlanM2", "Surface Area");
                int colAdres = GetCol(8, "Adres", "Address");
                int colKoordinat = GetCol(9, "Koordinatlar", "Koordinat", "Coordinates");

                // Satırları Gezme (1. satır başlık olduğu için 2. satırdan başlıyoruz)
                var rows = worksheet.RangeUsed().RowsUsed().Skip(1);

                // Tüm illeri hızlı arama için hafızaya alıyoruz (Sadece 81 kayıt)
                var iller = await _context.Iller.AsNoTracking().ToListAsync();

                // İlçe ve Mahalle önbelleği (Performans için)
                var ilceCache = new Dictionary<int, List<Ilce>>();
                var mahalleCache = new Dictionary<int, List<Mahalle>>();

                int satirNo = 2;
                int mukerrerSayisi = 0;
                foreach (var row in rows)
                {
                    string ilAdi = (colIl > 0 ? row.Cell(colIl).GetString() : "").Trim();
                    string ilceAdi = (colIlce > 0 ? row.Cell(colIlce).GetString() : "").Trim();
                    string mahalleAdi = (colMahalle > 0 ? row.Cell(colMahalle).GetString() : "").Trim();
                    string adaNo = (colAda > 0 ? row.Cell(colAda).GetString() : "").Trim();
                    string parselNo = (colParsel > 0 ? row.Cell(colParsel).GetString() : "").Trim();
                    string tasinmazTipi = (colTip > 0 ? row.Cell(colTip).GetString() : "").Trim();
                    string alanStr = (colAlan > 0 ? row.Cell(colAlan).GetString() : "").Trim();
                    string adres = (colAdres > 0 ? row.Cell(colAdres).GetString() : "").Trim();
                    string koordinatStr = (colKoordinat > 0 ? row.Cell(colKoordinat).GetString() : "").Trim();

                    // Boş satır kontrolü
                    if (string.IsNullOrWhiteSpace(ilAdi) && string.IsNullOrWhiteSpace(adaNo) && string.IsNullOrWhiteSpace(koordinatStr))
                    {
                        continue;
                    }

                    // Zorunlu alan kontrolü
                    if (string.IsNullOrWhiteSpace(ilAdi) || string.IsNullOrWhiteSpace(ilceAdi) ||
                        string.IsNullOrWhiteSpace(mahalleAdi) || string.IsNullOrWhiteSpace(adaNo) ||
                        string.IsNullOrWhiteSpace(parselNo) || string.IsNullOrWhiteSpace(koordinatStr))
                    {
                        return (false, $"Satır {satirNo}: Zorunlu alanlardan biri (İl, İlçe, Mahalle, Ada, Parsel, Koordinat) boş bırakılmış.", 0);
                    }

                    // 1. İl Bulma (Büyük/Küçük harf duyarsız)
                    var eslesenIl = iller.FirstOrDefault(i => string.Equals(i.Ad, ilAdi, StringComparison.OrdinalIgnoreCase) ||
                                                              string.Equals(NormalizeText(i.Ad), NormalizeText(ilAdi), StringComparison.OrdinalIgnoreCase));
                    if (eslesenIl == null)
                    {
                        return (false, $"Satır {satirNo}: '{ilAdi}' ili sistemde bulunamadı.", 0);
                    }

                    // 2. İlçeleri Getir ve Eşleştir
                    if (!ilceCache.TryGetValue(eslesenIl.Id, out var ilceler))
                    {
                        ilceler = await _context.Ilceler.AsNoTracking().Where(i => i.IlId == eslesenIl.Id).ToListAsync();
                        ilceCache[eslesenIl.Id] = ilceler;
                    }

                    var eslesenIlce = ilceler.FirstOrDefault(i => string.Equals(i.Ad, ilceAdi, StringComparison.OrdinalIgnoreCase) ||
                                                                  string.Equals(NormalizeText(i.Ad), NormalizeText(ilceAdi), StringComparison.OrdinalIgnoreCase));
                    if (eslesenIlce == null)
                    {
                        return (false, $"Satır {satirNo}: '{ilAdi}' iline bağlı '{ilceAdi}' ilçesi sistemde bulunamadı.", 0);
                    }

                    // 3. Mahalleleri Getir ve Esnek Eşleştir (Mahallesi / Mah. / Köyü eklerini tolere eder)
                    if (!mahalleCache.TryGetValue(eslesenIlce.Id, out var mahalleler))
                    {
                        mahalleler = await _context.Mahalleler.AsNoTracking().Where(m => m.IlceId == eslesenIlce.Id).ToListAsync();
                        mahalleCache[eslesenIlce.Id] = mahalleler;
                    }

                    var normExcelMahalle = NormalizeMahalle(mahalleAdi);
                    var eslesenMahalle = mahalleler.FirstOrDefault(m =>
                        string.Equals(m.Ad, mahalleAdi, StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(NormalizeMahalle(m.Ad), normExcelMahalle, StringComparison.OrdinalIgnoreCase) ||
                        NormalizeMahalle(m.Ad).Contains(normExcelMahalle) ||
                        normExcelMahalle.Contains(NormalizeMahalle(m.Ad)));

                    if (eslesenMahalle == null)
                    {
                        return (false, $"Satır {satirNo}: '{ilceAdi}' ilçesine bağlı '{mahalleAdi}' mahallesi sistemde bulunamadı.", 0);
                    }

                    // 4. SRS Mükerrer Kontrolü (Aynı Mahalle + Ada + Parsel zaten var mı?)
                    bool veritabanindaVarMi = await _context.Tasinmazlar.AnyAsync(t =>
                        t.MahalleId == eslesenMahalle.Id &&
                        t.AdaNo.ToLower() == adaNo.ToLower() &&
                        t.ParselNo.ToLower() == parselNo.ToLower());

                    bool listedeVarMi = eklenecekTasinmazlar.Any(t =>
                        t.MahalleId == eslesenMahalle.Id &&
                        string.Equals(t.AdaNo, adaNo, StringComparison.OrdinalIgnoreCase) &&
                        string.Equals(t.ParselNo, parselNo, StringComparison.OrdinalIgnoreCase));

                    if (veritabanindaVarMi || listedeVarMi)
                    {
                        mukerrerSayisi++;
                        satirNo++;
                        continue; // Mükerrer kaydı atla
                    }

                    // Alan (m2) Parse Etme
                    decimal alanM2 = 0;
                    if (!string.IsNullOrWhiteSpace(alanStr))
                    {
                        alanStr = alanStr.Replace(",", ".");
                        decimal.TryParse(alanStr, NumberStyles.Any, CultureInfo.InvariantCulture, out alanM2);
                    }

                    // Koordinat Metnini Poligona Çevirme (Format: "32.85,39.90; 32.86,39.90; ...")
                    var coordinates = new List<Coordinate>();
                    try
                    {
                        var noktaDizisi = koordinatStr.Split(new[] { ';', '|' }, StringSplitOptions.RemoveEmptyEntries);
                        foreach (var nokta in noktaDizisi)
                        {
                            var parcalar = nokta.Trim().Split(new[] { ',', ' ' }, StringSplitOptions.RemoveEmptyEntries);
                            if (parcalar.Length >= 2)
                            {
                                double lon = double.Parse(parcalar[0].Replace(",", "."), CultureInfo.InvariantCulture);
                                double lat = double.Parse(parcalar[1].Replace(",", "."), CultureInfo.InvariantCulture);
                                coordinates.Add(new Coordinate(lon, lat));
                            }
                        }

                        if (coordinates.Count < 3)
                        {
                            return (false, $"Satır {satirNo}: Geçerli bir poligon için en az 3 koordinat noktası gereklidir.", 0);
                        }
                          
                        // Poligonu kapatma kuralı (İlk nokta ile son nokta aynı olmalıdır)
                        if (!coordinates.First().Equals2D(coordinates.Last()))
                        {
                            coordinates.Add(coordinates.First());
                        }

                        if (coordinates.Count < 4)
                        {
                            return (false, $"Satır {satirNo}: Geçerli bir kapalı poligon oluşturulamadı.", 0);
                        }
                    }
                    catch (Exception)
                    {
                        return (false, $"Satır {satirNo}: Koordinat formatı hatalı. Örnek: '32.859,39.905; 32.861,39.905; 32.861,39.903; 32.859,39.903; 32.859,39.905'", 0);
                    }

                    var ring = geometryFactory.CreateLinearRing(coordinates.ToArray());
                    var polygon = geometryFactory.CreatePolygon(ring);

                    var tasinmaz = new Tasinmaz
                    {
                        KullaniciId = string.IsNullOrWhiteSpace(kullaniciId) ? "00000000-0000-0000-0000-000000000001" : kullaniciId,
                        MahalleId = eslesenMahalle.Id,
                        AdaNo = adaNo,
                        ParselNo = parselNo,
                        Adres = string.IsNullOrWhiteSpace(adres) ? $"{eslesenMahalle.Ad}, {eslesenIlce.Ad} / {eslesenIl.Ad}" : adres,
                        TasinmazTipi = string.IsNullOrWhiteSpace(tasinmazTipi) ? "Konut" : tasinmazTipi,
                        AlanM2 = alanM2,
                        Sinir = polygon
                    };

                    eklenecekTasinmazlar.Add(tasinmaz);
                    satirNo++;
                }

                if (!eklenecekTasinmazlar.Any())
                {
                    if (mukerrerSayisi > 0)
                    {
                        return (true, $"Excel dosyasındaki {mukerrerSayisi} adet taşınmazın tamamı sistemde zaten kayıtlı olduğu için mükerrer kayıt eklenmedi.", 0);
                    }
                    return (false, "Excel dosyasında eklenecek geçerli bir veri satırı bulunamadı.", 0);
                }

                // Veritabanına Transaction ile Toplu Kayıt
                using var transaction = await _context.Database.BeginTransactionAsync();
                await _context.Tasinmazlar.AddRangeAsync(eklenecekTasinmazlar);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                string sonucMesaj = mukerrerSayisi > 0
                    ? $"{eklenecekTasinmazlar.Count} yeni taşınmaz başarıyla eklendi ({mukerrerSayisi} adet mükerrer kayıt atlandı)."
                    : $"{eklenecekTasinmazlar.Count} adet taşınmaz başarıyla sisteme aktarıldı.";

                return (true, sonucMesaj, eklenecekTasinmazlar.Count);
            }
            catch (Exception ex)
            {
                return (false, $"İçe aktarma sırasında beklenmeyen bir hata oluştu: {ex.Message}", 0);
            }
        }

        private static string NormalizeText(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return string.Empty;
            return text.Trim().ToLower(new CultureInfo("tr-TR"));
        }

        private static string NormalizeMahalle(string mahalle)
        {
            if (string.IsNullOrWhiteSpace(mahalle)) return string.Empty;
            return mahalle.Trim()
                .Replace(" Mahallesi", "", StringComparison.OrdinalIgnoreCase)
                .Replace(" Mah.", "", StringComparison.OrdinalIgnoreCase)
                .Replace(" Mah", "", StringComparison.OrdinalIgnoreCase)
                .Replace(" Köyü", "", StringComparison.OrdinalIgnoreCase)
                .Trim()
                .ToLower(new CultureInfo("tr-TR"));
        }
    }
}