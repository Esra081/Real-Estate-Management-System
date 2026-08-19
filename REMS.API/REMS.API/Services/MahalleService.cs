using Microsoft.EntityFrameworkCore;
using REMS.API.Data;
using REMS.API.DTOs.Mahalle;
using REMS.API.Interfaces;

namespace REMS.API.Services
{
    public class MahalleService : IMahalleService
    {
        private readonly RemsDbContext _context;

        public MahalleService(RemsDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MahalleListDto>> GetAllAsync()
        {
            return await _context.Mahalleler
                .Select(x => new MahalleListDto
                {
                    Id = x.Id,
                    Ad = x.Ad,
                    IlceId = x.IlceId
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<MahalleListDto>> GetByIlceIdAsync(int ilceId)
        {
            return await _context.Mahalleler
                .AsNoTracking()
                .Where(x => x.IlceId == ilceId)
                .OrderBy(x => x.Ad)
                .Select(x => new MahalleListDto
                {
                    Id = x.Id,
                    Ad = x.Ad,
                    IlceId = x.IlceId
                })
                .ToListAsync();
        }
    }
}