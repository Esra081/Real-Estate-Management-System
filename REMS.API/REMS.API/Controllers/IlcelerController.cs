using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using REMS.API.Data;

namespace REMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IlcelerController : ControllerBase
    {
        private readonly RemsDbContext _context;

        public IlcelerController(RemsDbContext context)
        {
            _context = context;
        }

        // GET: api/ilceler
        [HttpGet]
        public async Task<IActionResult> GetIlceler()
        {
            // İlçeleri çekerken bağlı olduğu İl'in adını da beraberinde getirmek için .Include kullanıyoruz
            var ilceler = await _context.Ilceler
                .Include(i => i.Il)
                .ToListAsync();

            return Ok(ilceler);
        }

        // GET: api/ilceler/il/1 (Belirli bir ile ait ilçeleri getirmek için)
        [HttpGet("il/{ilId}")]
        public async Task<IActionResult> GetIlcelerByIlId(int ilId)
        {
            var ilceler = await _context.Ilceler
                .Where(i => i.IlId == ilId)
                .ToListAsync();

            return Ok(ilceler);
        }
    }
}