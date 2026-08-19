using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using REMS.API.Data;
using REMS.API.DTOs.Ilce;
using REMS.API.Interfaces;

namespace REMS.API.Services
{
    public class IlceService : IIlceService
    {
        private readonly RemsDbContext _context;

        public IlceService(RemsDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<IlceListDTO>> GetByIlIdAsync(int ilId)
        {
            return await _context.Ilceler
                .AsNoTracking()
                .Where(x => x.IlId == ilId)
                .OrderBy(x => x.Ad)
                .Select(i => new IlceListDTO { Id = i.Id, Ad = i.Ad, IlId = i.IlId })
                .ToListAsync();
        }
    }
}