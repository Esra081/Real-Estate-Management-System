using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using REMS.API.Data;

namespace REMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IllerController : ControllerBase
    {
        private readonly RemsDbContext _context;

        public IllerController(RemsDbContext context)
        {
            _context = context;
        }

        // GET: api/iller
        [HttpGet]
        public async Task<IActionResult> GetIller()
        {
            var iller = await _context.Iller.ToListAsync();
            return Ok(iller);
        }
    }
}