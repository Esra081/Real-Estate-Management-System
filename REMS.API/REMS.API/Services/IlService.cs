using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using REMS.API.Data;
using REMS.API.DTOs.Il;
using REMS.API.Interfaces; // IIlService'i bulabilmesi için eklendi

namespace REMS.API.Services
{
    public class IlService : IIlService
    {
        private readonly RemsDbContext _context;

        public IlService(RemsDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<IlListDTO>> GetAllAsync()
        {
            return await _context.Iller
                .Select(i => new IlListDTO { Id = i.Id, Ad = i.Ad })
                .ToListAsync();
        }
    }
}