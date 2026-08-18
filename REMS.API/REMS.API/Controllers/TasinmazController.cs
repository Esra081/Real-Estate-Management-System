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

        public TasinmazController(ITasinmazService tasinmazService)
        {
            _tasinmazService = tasinmazService;
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

            var sonuc = await _tasinmazService.AddPropertyAsync(model);
            if (sonuc) return Ok(new { message = "Taşınmaz başarıyla eklendi!" });

            return StatusCode(500, new { message = "Taşınmaz eklenirken hata oluştu." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProperty(int id, [FromBody] TasinmazUpdateDto model)
        {
            if (id != model.Id)
                return BadRequest(new { message = "URL'deki ID ile modeldeki ID aynı olmalıdır." });

            var sonuc = await _tasinmazService.UpdatePropertyAsync(model);
            if (!sonuc)
                return NotFound(new { message = "Güncellenecek taşınmaz bulunamadı." });

            return Ok(new { message = "Taşınmaz başarıyla güncellendi!" });
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
    }
}