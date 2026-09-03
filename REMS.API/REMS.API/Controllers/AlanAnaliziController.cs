using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using REMS.API.DTOs.AlanAnalizi;
using REMS.API.Helpers;
using REMS.API.Interfaces;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace REMS.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AlanAnaliziController : ControllerBase
    {
        private readonly IAlanAnaliziService _alanAnaliziService;

        public AlanAnaliziController(IAlanAnaliziService alanAnaliziService)
        {
            _alanAnaliziService = alanAnaliziService;
        }

        [HttpPost("geometri")]
        public async Task<IActionResult> KaydetGeometriler([FromBody] List<PoligonDto> geometriler)
        {
            var userId = User.GetUserId();
            var (success, message) = await _alanAnaliziService.KaydetGeometrilerAsync(geometriler, userId);

            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }

        [HttpGet("auto-select")]
        public async Task<IActionResult> GetAutoSelectGeometriler()
        {
            var userId = User.GetUserId();
            var geometriler = await _alanAnaliziService.GetAutoSelectGeometrilerAsync(userId);
            return Ok(geometriler);
        }

        [HttpPost("kesisim")]
        public async Task<IActionResult> KesisimHesapla([FromBody] KesisimIstekDto istek)
        {
            var userId = User.GetUserId();

            var sonuc = await _alanAnaliziService.KesisimHesaplaAsync(istek.P1, istek.P2, istek.Geometriler, userId);

            if (!sonuc.Basarili)
                return BadRequest(sonuc);

            return Ok(sonuc);
        }

        [HttpPost("birlesim")]
        public async Task<IActionResult> BirlesimHesapla([FromBody] BirlesimIstekDto istek)
        {
            var userId = User.GetUserId();

            var sonuc = await _alanAnaliziService.BirlesimHesaplaAsync(istek.Etiketler, istek.Geometriler, userId);

            if (!sonuc.Basarili)
                return BadRequest(sonuc);

            return Ok(sonuc);
        }
    }
}