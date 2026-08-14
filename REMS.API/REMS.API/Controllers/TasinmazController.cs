using Microsoft.AspNetCore.Mvc;
using REMS.API.DTOs.Property;
using REMS.API.Interfaces;
using System.Threading.Tasks;

namespace REMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TasinmazController : ControllerBase
    {
        private readonly ITasinmazService _propertyService;

        public TasinmazController(ITasinmazService propertyService)
        {
            _propertyService = propertyService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tasinmazlar = await _propertyService.GetAllPropertiesAsync();
            return Ok(tasinmazlar);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var tasinmaz = await _propertyService.GetPropertyByIdAsync(id);
            if (tasinmaz == null) return NotFound(new { message = "Kayıt bulunamadı." });
            return Ok(tasinmaz);
        }

        [HttpPost("ekle")]
        public async Task<IActionResult> AddProperty([FromBody] TasinmazCreateDto model)
        {
            if (model == null || model.Koordinatlar.Count < 3)
                return BadRequest(new { message = "Bir poligon için en az 3 nokta gereklidir." });

            var sonuc = await _propertyService.AddPropertyAsync(model);
            if (sonuc) return Ok(new { message = "Taşınmaz başarıyla eklendi!" });

            return StatusCode(500, new { message = "Taşınmaz eklenirken hata oluştu." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProperty(
            int id,
            [FromBody] TasinmazUpdateDto model)
        {
            if (id != model.Id)
            {
                return BadRequest(new
                {
                    message = "URL'deki ID ile modeldeki ID aynı olmalıdır."
                });
            }

            var sonuc = await _propertyService.UpdatePropertyAsync(model);

            if (!sonuc)
            {
                return NotFound(new
                {
                    message = "Güncellenecek taşınmaz bulunamadı."
                });
            }

            return Ok(new
            {
                message = "Taşınmaz başarıyla güncellendi!"
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProperty(int id)
        {
            var sonuc = await _propertyService.DeletePropertyAsync(id);

            if (!sonuc)
            {
                return NotFound(new
                {
                    message = "Silinecek kayıt bulunamadı."
                });
            }

            return Ok(new
            {
                message = "Taşınmaz başarıyla silindi!"
            });
        }
    }
}