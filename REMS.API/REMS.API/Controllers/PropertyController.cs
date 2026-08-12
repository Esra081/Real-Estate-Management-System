using Microsoft.AspNetCore.Mvc;
using REMS.API.DTOs.Property;
using REMS.API.Interfaces;

namespace REMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PropertyController : ControllerBase
    {
        private readonly IPropertyService _propertyService;

        public PropertyController(IPropertyService propertyService)
        {
            _propertyService = propertyService;
        }

        [HttpPost("ekle")]
        public async Task<IActionResult> AddProperty([FromBody] PropertyCreateDto model)
        {
            // Poligon çizebilmek için en az 3 köşeye ihtiyaç vardır.
            if (model == null || model.Koordinatlar.Count < 3)
            {
                return BadRequest(new { message = "Bir poligon için en az 3 nokta gereklidir." });
            }

            var sonuc = await _propertyService.AddPropertyAsync(model);

            if (sonuc)
            {
                return Ok(new { message = "Taşınmaz başarıyla eklendi!" });
            }

            return StatusCode(500, new { message = "Taşınmaz eklenirken hata oluştu." });
        }
    }
}