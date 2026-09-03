using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using REMS.API.DTOs;
using REMS.API.DTOs.Property;
using REMS.API.Interfaces;
using REMS.API.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace REMS.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TasinmazController : ControllerBase
    {
        private readonly ITasinmazService _tasinmazService;
        private readonly IExportService _exportService;
        private readonly IImportService _importService;
        private readonly ILogService _logService;

        public TasinmazController(
            ITasinmazService tasinmazService,
            IExportService exportService,
            IImportService importService,
            ILogService logService)
        {
            _tasinmazService = tasinmazService;
            _exportService = exportService;
            _importService = importService;
            _logService = logService;
        }

        [HttpGet]
        public async Task<IActionResult> GetTasinmazlar([FromQuery] TasinmazFilterDto filter)
        {
            var tasinmazlar = await _tasinmazService.GetFilteredTasinmazlarAsync(filter);
            return Ok(tasinmazlar);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var tasinmaz = await _tasinmazService.GetPropertyByIdAsync(id);
            if (tasinmaz == null) return NotFound(new { message = "Kayıt bulunamadı." });
            return Ok(tasinmaz);
        }

        [HttpPost("ekle")]
        public async Task<IActionResult> AddProperty([FromBody] TasinmazCreateDto model)
        {
            if (User.IsInRole("Admin"))
                return StatusCode(403, new { message = "Yöneticiler doğrudan taşınmaz ekleyemez." });

            if (model == null || model.Koordinatlar.Count < 3)
                return BadRequest(new { message = "Bir poligon için en az 3 nokta gereklidir." });

            if (string.IsNullOrEmpty(model.KullaniciId))
            {
                model.KullaniciId = User.GetUserId();
            }

            try
            {
                var yeniId = await _tasinmazService.AddPropertyAsync(model);
                if (yeniId > 0)
                {
                    await _logService.LogAsync("Taşınmaz Ekleme", $"Ada: {model.AdaNo}, Parsel: {model.ParselNo}, Tip: {model.TasinmazTipi} mülkü eklendi.", "Basarili", model.KullaniciId);
                    return Ok(new { message = "Taşınmaz başarıyla eklendi!", id = yeniId });
                }
                return StatusCode(500, new { message = "Taşınmaz eklenirken hata oluştu." });
            }
            catch (InvalidOperationException ex)
            {
                await _logService.LogAsync("Taşınmaz Ekleme", $"Ekleme hatası: {ex.Message}", "Basarisiz", model.KullaniciId);
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProperty(int id, [FromBody] TasinmazUpdateDto model)
        {
            if (User.IsInRole("Admin"))
                return StatusCode(403, new { message = "Yöneticiler taşınmaz güncelleyemez." });

            if (id != model.Id)
                return BadRequest(new { message = "URL'deki ID ile modeldeki ID aynı olmalıdır." });

            if (string.IsNullOrEmpty(model.KullaniciId))
            {
                model.KullaniciId = User.GetUserId();
            }

            try
            {
                var sonuc = await _tasinmazService.UpdatePropertyAsync(model);
                if (!sonuc.Success)
                    return NotFound(new { message = sonuc.Message });

                if (!sonuc.HasChanges)
                {
                    return Ok(new { message = "Herhangi bir değişiklik yapılmadı.", hasChanges = false });
                }

                string logAciklama = $"ID: {id} taşınmazı (Ada: {model.AdaNo}, Parsel: {model.ParselNo}) güncellendi. Değişiklikler: [{sonuc.DiffSummary}]";
                await _logService.LogAsync("Taşınmaz Güncelleme", logAciklama, "Basarili", model.KullaniciId);

                return Ok(new { message = "Taşınmaz başarıyla güncellendi!", hasChanges = true, diffSummary = sonuc.DiffSummary });
            }
            catch (InvalidOperationException ex)
            {
                await _logService.LogAsync("Taşınmaz Güncelleme", $"ID: {id} taşınmazı güncellenirken hata: {ex.Message}", "Basarisiz", model.KullaniciId);
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProperty(int id)
        {
            if (User.IsInRole("Admin"))
                return StatusCode(403, new { message = "Yöneticiler doğrudan taşınmaz silemez." });

            var sonuc = await _tasinmazService.DeletePropertyAsync(id);
            if (!sonuc)
                return NotFound(new { message = "Silinecek kayıt bulunamadı." });

            await _logService.LogAsync("Taşınmaz Silme", $"ID: {id} numaralı taşınmaz sistemden silindi.", "Basarili");
            return Ok(new { message = "Taşınmaz silindi!" });
        }

        [HttpPost("toplu-sil")]
        public async Task<IActionResult> DeleteProperties([FromBody] List<int> ids)
        {
            if (User.IsInRole("Admin"))
                return StatusCode(403, new { message = "Yöneticiler taşınmaz silemez." });

            if (ids == null || !ids.Any())
                return BadRequest(new { message = "Silinecek taşınmaz ID listesi boş olamaz." });

            var sonuc = await _tasinmazService.DeletePropertiesAsync(ids);
            if (!sonuc)
                return NotFound(new { message = "Silinecek kayıtlar bulunamadı." });

            await _logService.LogAsync("Toplu Taşınmaz Silme", $"{ids.Count} adet taşınmaz topluca silindi. (ID'ler: {string.Join(", ", ids)})", "Basarili");
            return Ok(new { message = $"{ids.Count} adet taşınmaz başarıyla silindi." });
        }

        [HttpGet("export/excel")]
        public async Task<IActionResult> ExportToExcel([FromQuery] TasinmazFilterDto filter)
        {
            filter.PageSize = int.MaxValue;
            filter.PageNumber = 1;
            
            var pagedResult = await _tasinmazService.GetFilteredTasinmazlarAsync(filter);
            var excelBytes = _exportService.ExportTasinmazlarToExcel(pagedResult.Data);

            await _logService.LogAsync("Excel Dışa Aktarma", "Taşınmaz listesi Excel dosyası olarak indirildi.", "Basarili", filter.KullaniciId);

            return File(
                excelBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Tasinmazlar_{DateTime.Now:yyyyMMdd_HHmm}.xlsx"
            );
        }

        [HttpGet("export/pdf")]
        public async Task<IActionResult> ExportToPdf([FromQuery] TasinmazFilterDto filter)
        {
            filter.PageSize = int.MaxValue;
            filter.PageNumber = 1;

            var pagedResult = await _tasinmazService.GetFilteredTasinmazlarAsync(filter);
            var pdfBytes = _exportService.ExportTasinmazlarToPdf(pagedResult.Data);

            await _logService.LogAsync("PDF Dışa Aktarma", "Taşınmaz listesi PDF raporu olarak indirildi.", "Basarili", filter.KullaniciId);

            return File(
                pdfBytes,
                "application/pdf",
                $"Tasinmazlar_{DateTime.Now:yyyyMMdd_HHmm}.pdf"
            );
        }

        [HttpPost("import-excel")]
        public async Task<IActionResult> ImportFromExcel(Microsoft.AspNetCore.Http.IFormFile file, [FromForm] string? kullaniciId)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Lütfen bir Excel (.xlsx) dosyası yükleyin." });

            if (User.IsInRole("Admin"))
                return StatusCode(403, new { message = "Yöneticiler Excel ile taşınmaz ekleyemez." });

            string? hedefKullaniciId = !string.IsNullOrEmpty(kullaniciId) ? kullaniciId : User.GetUserId();

            if (string.IsNullOrEmpty(hedefKullaniciId))
                return Unauthorized(new { message = "Kullanıcı oturumu bulunamadı. Lütfen giriş yapınız." });

            var (success, message, count) = await _importService.ImportTasinmazlarFromExcelAsync(file, hedefKullaniciId);

            if (!success)
            {
                await _logService.LogAsync("Excel İçe Aktarma", $"Excel yükleme başarısız: {message}", "Basarisiz", hedefKullaniciId);
                return BadRequest(new { message });
            }

            await _logService.LogAsync("Excel İçe Aktarma", $"Excel dosyasından {count} adet yeni taşınmaz yüklendi.", "Basarili", hedefKullaniciId);
            return Ok(new { message, count });
        }

        [HttpPost("{id}/resim-yukle")]
        public async Task<IActionResult> ResimYukle(int id, Microsoft.AspNetCore.Http.IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Lütfen geçerli bir fotoğraf dosyası (JPEG/PNG) seçiniz." });

            string? userId = User.GetUserId();

            try
            {
                var dosyaErisimYolu = await _tasinmazService.ResimYukleAsync(id, file);
                await _logService.LogAsync("Fotoğraf Yükleme", $"ID: {id} numaralı taşınmaza yeni fotoğraf yüklendi. Dosya: {file.FileName}", "Basarili", userId);
                return Ok(new { message = "Fotoğraf başarıyla yüklendi!", resimUrl = dosyaErisimYolu });
            }
            catch (InvalidOperationException ex)
            {
                await _logService.LogAsync("Fotoğraf Yükleme", $"ID: {id} taşınmazına fotoğraf yüklenirken hata: {ex.Message}", "Basarisiz", userId);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                await _logService.LogAsync("Fotoğraf Yükleme", $"ID: {id} taşınmazı için fotoğraf sunucu hatası: {ex.Message}", "Basarisiz", userId);
                return StatusCode(500, new { message = "Fotoğraf yüklenirken bir hata oluştu: " + ex.Message });
            }
        }
    }
}