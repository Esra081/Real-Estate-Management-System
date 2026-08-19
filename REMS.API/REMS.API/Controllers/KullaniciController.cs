using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using REMS.API.DTOs.Kullanici;
using REMS.API.Interfaces;

namespace REMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KullaniciController : ControllerBase
    {
        private readonly IKullaniciService _kullaniciService;

        public KullaniciController(IKullaniciService kullaniciService)
        {
            _kullaniciService = kullaniciService;
        }

        [HttpGet]
        public async Task<IActionResult> GetKullanicilar()
        {
            var liste = await _kullaniciService.GetAllKullanicilarAsync();
            return Ok(liste);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var kullanici = await _kullaniciService.GetKullaniciByIdAsync(id);
            if (kullanici == null)
                return NotFound(new { message = "Kullanıcı bulunamadı." });

            return Ok(kullanici);
        }

        [HttpPost]
        public async Task<IActionResult> AddKullanici([FromBody] KullaniciCreateDto model)
        {
            var (success, message) = await _kullaniciService.AddKullaniciAsync(model);
            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateKullanici(Guid id, [FromBody] KullaniciUpdateDto model)
        {
            if (id != model.Id)
                return BadRequest(new { message = "URL'deki ID ile model ID uyuşmuyor." });

            var (success, message) = await _kullaniciService.UpdateKullaniciAsync(model);
            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteKullanici(Guid id)
        {
            var (success, message) = await _kullaniciService.DeleteKullaniciAsync(id);
            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }
    }
}