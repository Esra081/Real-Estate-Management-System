using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using REMS.API.Data;
using REMS.API.DTOs.Auth;
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

        public async Task<string?> LoginAsync(LoginDto model)
        {
            if (string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.Sifre))
            {
                return null;
            }

            var emailClean = model.Email.ToLower().Trim();

            // 1. Kullanıcıyı e-posta adresine göre bul (Büyük/Küçük harf duyarsız)
            var kullanici = await _context.Kullanicilar
                .FirstOrDefaultAsync(k => k.Email.ToLower() == emailClean);

            if (kullanici == null || !kullanici.AktifMi)
            {
                return null;
            }

            // 2. Şifre Doğrulama (SHA-256 + Salt veya eski test şifreleri)
            bool sifreDogruMu = _hashService.VerifyPassword(model.Sifre, kullanici.SifreHash, kullanici.SifreSalt);
            
            // Eğer hash tutmazsa düz metin kontrolü (Geriye dönük uyumluluk)
            if (!sifreDogruMu && (kullanici.SifreHash == model.Sifre || kullanici.SifreHash == "ornek_hash"))
            {
                sifreDogruMu = true;
            }

            if (!sifreDogruMu)
            {
                return null;
            }

            // 3. Kullanıcıya özel JWT Token üret
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
    }
}