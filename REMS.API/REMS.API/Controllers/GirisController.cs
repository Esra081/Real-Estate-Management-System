using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using REMS.API.DTOs;
using REMS.API.DTOs.Auth;
using REMS.API.Helpers;
using REMS.API.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;

namespace REMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GirisController : ControllerBase
    {
        private readonly IGirisService _authService;
        private readonly ILogService _logService;

        public GirisController(IGirisService authService, ILogService logService)
        {
            _authService = authService;
            _logService = logService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var token = await _authService.LoginAsync(model);

            if (token == null)
            {
                await _logService.LogAsync("Giriş", $"Hatalı şifre veya e-posta ile giriş denemesi: {model.Email}", "Basarisiz", null, model.Email);
                return Unauthorized(new { message = "E-posta veya şifre hatalı!" });
            }
            await _logService.LogAsync("Giriş", $"Kullanıcı sisteme başarıyla giriş yaptı: {model.Email}", "Basarili", null, model.Email);

            return Ok(new
            {
                token = token,
                message = "Giriş başarılı!"
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            var (success, message) = await _authService.RegisterAsync(request);

            if (!success)
            {
                await _logService.LogAsync("Kayıt", $"Başarısız kayıt denemesi: {request.Email} - Gerekçe: {message}", "Basarisiz", null, request.Email);
                return BadRequest(new { message });
            }

            await _logService.LogAsync("Kayıt", $"Yeni kullanıcı hesabı oluşturuldu: {request.Email}", "Basarili", null, request.Email);

            return Ok(new { message });
        }


        [Authorize]
        [HttpPost("yenile")]
        public async Task<IActionResult> TokenYenile()
        {
            var userId = User.GetUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Geçersiz kullanıcı oturumu." });
            }

            var token = await _authService.YenileTokenAsync(userId);
            if (token == null)
            {
                return Unauthorized(new { message = "Kullanıcı bulunamadı veya oturum yenilenemedi." });
            }

            var email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.Identity?.Name ?? "Bilinmiyor";
            await _logService.LogAsync("Oturum Yenileme", $"{email} kullanıcısı oturum süresini 1 saat uzattı.", "Basarili", userId, email);

            return Ok(new
            {
                token = token,
                message = "Oturum süreniz başarıyla uzatıldı."
            });
        }


        [Authorize]
        [HttpPost("cikis")]
        public async Task<IActionResult> Cikis([FromQuery] string? neden = null)
        {
            var userId = User.GetUserId();
            var email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.Identity?.Name ?? "Bilinmiyor";

            if (neden == "timeout")
            {
                await _logService.LogAsync(
                    "Oturum Zaman Aşımı",
                    $"1 saatlik işlem süresi dolduğu için {email} kullanıcısının oturumu sistem tarafından otomatik sonlandırıldı.",
                    "Basarili",
                    userId,
                    email
                );
            }
            else
            {
                await _logService.LogAsync(
                    "Çıkış",
                    $"{email} kullanıcısı sistemden güvenli çıkış yaptı.",
                    "Basarili",
                    userId,
                    email
                );
            }

            return Ok(new { message = "Çıkış işlemi kaydedildi." });
        }
    }
}
