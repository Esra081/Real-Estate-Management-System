using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using REMS.API.Data;
using REMS.API.DTOs;
using REMS.API.DTOs.Auth;
using REMS.API.Entities;
using REMS.API.Interfaces;

namespace REMS.API.Services
{
    public class GirisService : IGirisService
    {
        private readonly RemsDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly HashService _hashService;

        public GirisService(RemsDbContext context, IConfiguration configuration, HashService hashService)
        {
            _context = context;
            _configuration = configuration;
            _hashService = hashService;
        }

        // 1. GİRİŞ YAPMA (Sadece SHA-256 + Salt ile Güvenli Giriş)
        public async Task<string?> LoginAsync(LoginDto model)
        {
            if (string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.Sifre))
            {
                return null;
            }

            var emailClean = model.Email.ToLower().Trim();

            // Kullanıcıyı bul
            var kullanici = await _context.Kullanicilar
                .FirstOrDefaultAsync(k => k.Email.ToLower() == emailClean);

            if (kullanici == null || !kullanici.AktifMi)
            {
                return null;
            }

            //  SHA-256 + Salt Doğrulaması
            bool sifreDogruMu = _hashService.VerifyPassword(model.Sifre, kullanici.SifreHash, kullanici.SifreSalt ?? "");

            // İlk Kurulum Admini için Otomatik SHA-256 Yükseltmesi:
            // Eğer veritabanında admin henüz 'ornek_hash' durumundaysa ve 'Admin123!' ile giriyorsa
            // şifresini anında SHA-256 + Salt ile şifreleyip veritabanına kalıcı olarak kaydeder.
            if (!sifreDogruMu && kullanici.SifreHash == "ornek_hash" && model.Sifre == "Admin123!")
            {
                string yeniSalt = _hashService.CreateSalt();
                string yeniHash = _hashService.HashPassword("Admin123!", yeniSalt);
                kullanici.SifreSalt = yeniSalt;
                kullanici.SifreHash = yeniHash;
                await _context.SaveChangesAsync();
                sifreDogruMu = true;
            }

            // Şifre uyuşmuyorsa giriş reddedilir
            if (!sifreDogruMu)
            {
                return null;
            }

            //  JWT Token Üretimi
            var jwtKey = _configuration["Jwt:Key"] ?? "REMS_GIS_Secret_Key_Super_Secret_2026_Secure_Token_Authentication!";
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(jwtKey);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, kullanici.Id.ToString()),
                new Claim(ClaimTypes.Name, string.IsNullOrWhiteSpace(kullanici.AdSoyad) ? "Kullanıcı" : kullanici.AdSoyad),
                new Claim(ClaimTypes.Email, kullanici.Email),
                new Claim(ClaimTypes.Role, string.IsNullOrWhiteSpace(kullanici.Rol) ? "Kullanici" : kullanici.Rol)
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(120),
                Issuer = _configuration["Jwt:Issuer"] ?? "http://localhost:5000",
                Audience = _configuration["Jwt:Audience"] ?? "http://localhost:5000",
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        // 2. KAYIT OLMA (SHA-256 + Salt)
        public async Task<(bool Success, string Message)> RegisterAsync(RegisterDto request)
        {
            if (string.IsNullOrWhiteSpace(request.AdSoyad) || string.IsNullOrWhiteSpace(request.Email))
            {
                return (false, "Ad Soyad ve E-posta alanları zorunludur.");
            }

            var emailClean = request.Email.ToLower().Trim();

            // E-posta benzersizlik kontrolü
            bool emailVarMi = await _context.Kullanicilar.AnyAsync(x => x.Email.ToLower() == emailClean);
            if (emailVarMi)
            {
                return (false, "Bu e-posta adresi ile kayıtlı bir hesap zaten var.");
            }

            // Şifre kuralı kontrolü (8-12 karakter, harf+rakam+özel karakter)
            var (sifreGecerli, sifreHata) = SifreGecerliMi(request.Sifre);
            if (!sifreGecerli)
            {
                return (false, sifreHata);
            }

            // Güvenli SHA-256 Hash + Salt
            string salt = _hashService.CreateSalt();
            string hash = _hashService.HashPassword(request.Sifre, salt);

            var yeniKullanici = new Kullanici
            {
                Id = Guid.NewGuid(),
                AdSoyad = request.AdSoyad.Trim(),
                Email = emailClean,
                SifreHash = hash,
                SifreSalt = salt,
                Rol = "Kullanici", // Daima standart Kullanıcı rolü atanır
                AktifMi = true,
                OlusturmaTarihi = DateTime.UtcNow
            };

            await _context.Kullanicilar.AddAsync(yeniKullanici);
            await _context.SaveChangesAsync();

            return (true, "Hesabınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.");
        }

        private (bool Gecerli, string Hata) SifreGecerliMi(string sifre)
        {
            if (string.IsNullOrWhiteSpace(sifre) || sifre.Length < 8 || sifre.Length > 12)
                return (false, "Şifre 8 ile 12 karakter arasında olmalıdır.");

            bool harfVarMi = Regex.IsMatch(sifre, @"[a-zA-Z]");
            bool rakamVarMi = Regex.IsMatch(sifre, @"\d");
            bool ozelKarakterVarMi = Regex.IsMatch(sifre, @"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]");

            if (!harfVarMi || !rakamVarMi || !ozelKarakterVarMi)
                return (false, "Şifre en az 1 harf, 1 rakam ve 1 özel karakter içermelidir.");

            return (true, string.Empty);
        }
    }
}