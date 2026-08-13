using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using REMS.API.Data;

namespace REMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KullaniciController : ControllerBase
    {
        private readonly RemsDbContext _context;

        public KullaniciController(RemsDbContext context)
        {
            _context = context;
        }

        // GET: api/kullanicilar
        [HttpGet]
        public async Task<IActionResult> GetKullanicilar()
        {
            var kullanicilar = await _context.Kullanicilar
                .Select(k => new
                {
                    k.Id,
                    k.AdSoyad,
                    k.Email,
                    k.Rol,
                    k.OlusturmaTarihi,
                    k.AktifMi
                })
                .ToListAsync(); // Güvenlik amacıyla şifre hash/salt bilgilerini dışarıya açmıyoruz!

            return Ok(kullanicilar);
        }
    }
}