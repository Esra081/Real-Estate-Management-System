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
    [Route("api/[controller]")]
    [ApiController]
    public class AlanAnaliziController : ControllerBase
    {
        private readonly IAlanAnaliziService _alanAnaliziService;

        public AlanAnaliziController(IAlanAnaliziService alanAnaliziService)
        {
            _alanAnaliziService = alanAnaliziService;
        }

        // Kullanıcının haritada manuel çizdiği A, B, C poligonlarını kaydeder
        [HttpPost("geometri")]
        public async Task<IActionResult> KaydetGeometriler([FromBody] List<PoligonDto> geometriler)
        {
            var userId = User.GetUserId();
            var (success, message) = await _alanAnaliziService.KaydetGeometrilerAsync(geometriler, userId);

            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }

        // Kullanıcının daha önce kaydettiği A, B, C poligonlarını getirir
        [HttpGet("auto-select")]
        public async Task<IActionResult> GetAutoSelectGeometriler()
        {
            var userId = User.GetUserId();
            var geometriler = await _alanAnaliziService.GetAutoSelectGeometrilerAsync(userId);
            return Ok(geometriler);
        }


        // İki poligonun kesişimini hesaplar (A ∩ B) - DB'ye kaydedilmez, sadece ekranda gösterilir
        [HttpPost("kesisim")]
        public async Task<IActionResult> KesisimHesapla([FromBody] KesisimIstekDto istek)
        {
            // 1. JWT token'dan giriş yapmış kullanıcının ID'sini alıyoruz
            var userId = User.GetUserId();

            // 2. Servisimizdeki KesisimHesaplaAsync metodunu çağırıyoruz
            var sonuc = await _alanAnaliziService.KesisimHesaplaAsync(istek.P1, istek.P2, istek.Geometriler, userId);

            // 3. Eğer kesişim yoksa veya hata oluştuysa HTTP 400 BadRequest döner
            if (!sonuc.Basarili)
                return BadRequest(sonuc);

            // 4. Kesişim alanı ve m² başarıyla hesaplandıysa HTTP 200 Ok ile sonucu döner
            return Ok(sonuc);
        }

        // Poligonların birleşimini (A ∪ B -> D veya A ∪ B ∪ C -> E) hesaplar ve DB'ye KAYDEDER
        [HttpPost("birlesim")]
        public async Task<IActionResult> BirlesimHesapla([FromBody] BirlesimIstekDto istek)
        {
            // 1. JWT token'dan kullanıcının ID'sini alıyoruz
            var userId = User.GetUserId();

            // 2. Servisimizdeki BirlesimHesaplaAsync metodunu çağırıyoruz
            var sonuc = await _alanAnaliziService.BirlesimHesaplaAsync(istek.Etiketler, istek.Geometriler, userId);

            // 3. Eğer etiket sayısı yetersizse veya poligonlar bulunamadıysa HTTP 400 BadRequest döner
            if (!sonuc.Basarili)
                return BadRequest(sonuc);

            // 4. Birleşim tamamlanıp DB'ye D veya E olarak kaydedildiyse HTTP 200 Ok ile sonucu döner
            return Ok(sonuc);
        }
    }
}