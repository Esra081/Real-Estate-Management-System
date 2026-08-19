using Microsoft.AspNetCore.Mvc;
using REMS.API.DTOs;
using REMS.API.DTOs.Property;
using REMS.API.Interfaces;
using System.Threading.Tasks;

namespace REMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TasinmazController : ControllerBase
    {
        private readonly ITasinmazService _tasinmazService;
        private readonly IExportService _exportService;
        private readonly IImportService _importService;

        public TasinmazController(
            ITasinmazService tasinmazService,
            IExportService exportService,
            IImportService importService)
        {
            _tasinmazService = tasinmazService;
            _exportService = exportService;
            _importService = importService;
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
            if (model == null || model.Koordinatlar.Count < 3)
                return BadRequest(new { message = "Bir poligon için en az 3 nokta gereklidir." });

            try
            {
                var sonuc = await _tasinmazService.AddPropertyAsync(model);
                if (sonuc) return Ok(new { message = "Taşınmaz başarıyla eklendi!" });

                return StatusCode(500, new { message = "Taşınmaz eklenirken hata oluştu." });
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProperty(int id, [FromBody] TasinmazUpdateDto model)
        {
            if (id != model.Id)
                return BadRequest(new { message = "URL'deki ID ile modeldeki ID aynı olmalıdır." });

            try
            {
                var sonuc = await _tasinmazService.UpdatePropertyAsync(model);
                if (!sonuc)
                    return NotFound(new { message = "Güncellenecek taşınmaz bulunamadı." });

                return Ok(new { message = "Taşınmaz başarıyla güncellendi!" });
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProperty(int id)
        {
            var sonuc = await _tasinmazService.DeletePropertyAsync(id);
            if (!sonuc)
                return NotFound(new { message = "Silinecek kayıt bulunamadı." });

            return Ok(new { message = "Taşınmaz başarıyla silindi!" });
        }

        [HttpPost("toplu-sil")]
        public async Task<IActionResult> DeleteProperties([FromBody] List<int> ids)
        {
            if (ids == null || !ids.Any())
                return BadRequest(new { message = "Silinecek taşınmaz ID listesi boş olamaz." });

            var sonuc = await _tasinmazService.DeletePropertiesAsync(ids);
            if (!sonuc)
                return NotFound(new { message = "Silinecek kayıtlar bulunamadı." });

            return Ok(new { message = $"{ids.Count} adet taşınmaz başarıyla silindi!" });
        }

        [HttpGet("export/excel")]
        public async Task<IActionResult> ExportToExcel([FromQuery] TasinmazFilterDto filter)
        {
            // 1. Sayfalama kısıtını kaldırıyoruz (kullanıcı o anki filtredeki tüm verileri indirsin diye)
            filter.PageSize = int.MaxValue;
            filter.PageNumber = 1;
            // 2. Filtrelenmiş verileri veritabanından çekiyoruz
            var pagedResult = await _tasinmazService.GetFilteredTasinmazlarAsync(filter);

            // 3. Verileri Excel dosyası baytlarına dönüştürüyoruz
            var excelBytes = _exportService.ExportTasinmazlarToExcel(pagedResult.Data);
            // 4. Tarayıcıya dosya (.xlsx) indirme yanıtı dönüyoruz
            return File(
                excelBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Tasinmazlar_{System.DateTime.Now:yyyyMMdd_HHmm}.xlsx"
            );
        }

        [HttpGet("export/pdf")]
        public async Task<IActionResult> ExportToPdf([FromQuery] TasinmazFilterDto filter)
        {
            // 1. Sayfalama kısıtını kaldırıyoruz
            filter.PageSize = int.MaxValue;
            filter.PageNumber = 1;
            // 2. Filtrelenmiş verileri çekiyoruz
            var pagedResult = await _tasinmazService.GetFilteredTasinmazlarAsync(filter);

            // 3. Verileri PDF baytlarına dönüştürüyoruz
            var pdfBytes = _exportService.ExportTasinmazlarToPdf(pagedResult.Data);
            // 4. Tarayıcıya dosya (.pdf) indirme yanıtı dönüyoruz
            return File(
                pdfBytes,
                "application/pdf",
                $"Tasinmazlar_{System.DateTime.Now:yyyyMMdd_HHmm}.pdf"
            );

        }

        [HttpPost("import-excel")]
        public async Task<IActionResult> ImportFromExcel(Microsoft.AspNetCore.Http.IFormFile file)
        {
            // 1. Dosya var mı kontrolü
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Lütfen bir Excel (.xlsx) dosyası yükleyin." });
            // 2. Servisi çalıştırıp Excel verilerini doğrula ve kaydet
            string varsayilanKullaniciId = "00000000-0000-0000-0000-000000000001";
            var (success, message, count) = await _importService.ImportTasinmazlarFromExcelAsync(file, varsayilanKullaniciId);
            // 3. Sonuca göre HTTP yanıtı dön
            if (!success)
            {
                return BadRequest(new { message = message });
            }
            return Ok(new { message = message, count = count });
        }
    }
}