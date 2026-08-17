using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using REMS.API.Data;
using REMS.API.DTOs;
using REMS.API.DTOs.Auth;
using REMS.API.Entities;
using REMS.API.Interfaces;
using System;
using System.Linq;
using System.Security.Cryptography; // Hashing işlemleri (HMACSHA512) için
using System.Text;
using System.Threading.Tasks;

namespace REMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GirisController : ControllerBase
    {
        private readonly IGirisService _authService;


        private readonly RemsDbContext _context;

        // Constructor (Yapıcı Metot) içine context'i enjekte ediyoruz (Dependency Injection)
        public GirisController(IGirisService authService, RemsDbContext context)
        {
            _authService = authService;
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var token = await _authService.LoginAsync(model);

            if (token == null)
            {
                return Unauthorized(new { message = "E-posta veya şifre hatalı!" });
            }

            return Ok(new
            {
                token = token,
                message = "Giriş başarılı!"
            });
        }


        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            if (_context.Kullanicilar.Any(x => x.Email == request.Email))
            {
                return BadRequest(new { message = "Bu e-posta adresi zaten kullanılıyor." });
            }

            // GÜVENLİK: Şifreyi aşağıda yazdığımız metotla hashleyip tuzluyoruz.
            CreatePasswordHash(request.Sifre, out byte[] passwordHash, out byte[] passwordSalt);

            // MODEL OLUŞTURMA
            var yeniKullanici = new Kullanici
            {
                AdSoyad = request.AdSoyad, // DTO'dan gelen ismi veritabanı modeline aktarıyoruz
                Email = request.Email,
                SifreHash = Convert.ToBase64String(passwordHash),
                SifreSalt = Convert.ToBase64String(passwordSalt),
                Rol = "Kullanici"
            };

            // VERİTABANINA KAYIT
            _context.Kullanicilar.Add(yeniKullanici);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Kullanıcı başarıyla oluşturuldu." });
        }

        private void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            // HMACSHA512: .NET'in içindeki en güvenli kriptografi sınıflarından biridir.
            using (var hmac = new HMACSHA512())
            {
                passwordSalt = hmac.Key; // Algoritmanın ürettiği rastgele anahtarı Salt olarak alıyoruz.
                passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password)); // Şifreyi byte'a çevirip hash'liyoruz.
            }
        }
    }
}