using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using REMS.API.Data;
using REMS.API.DTOs.Kullanici;
using REMS.API.Interfaces;

namespace REMS.API.Services
{
    public class KullaniciService : IKullaniciService
    {
        private readonly RemsDbContext _context;

        public KullaniciService(RemsDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<KullaniciListDto>> GetKullanicilarAsync()
        {
            return await _context.Kullanicilar
                .Select(k => new KullaniciListDto
                {
                    Id = k.Id,
                    AdSoyad = k.AdSoyad,
                    Email = k.Email,
                    Rol = k.Rol,
                    OlusturmaTarihi = k.OlusturmaTarihi,
                    AktifMi = k.AktifMi
                })
                .ToListAsync();
        }
    }
}