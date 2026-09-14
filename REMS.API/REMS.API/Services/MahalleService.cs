using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using REMS.API.Data;
using REMS.API.DTOs.Mahalle;
using REMS.API.Interfaces;

namespace REMS.API.Services
{
    public class MahalleService : IMahalleService
    {
        private readonly RemsDbContext _context;
        private readonly IMapper _mapper;

        public MahalleService(RemsDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<MahalleListDto>> GetAllAsync()
        {
            // return await _context.Mahalleler
            //     .Select(x => new MahalleListDto
            //     {
            //         Id = x.Id,
            //         Ad = x.Ad,
            //         IlceId = x.IlceId
            //     })
            //     .ToListAsync();

            var mahalleler = await _context.Mahalleler.ToListAsync();
            return _mapper.Map<IEnumerable<MahalleListDto>>(mahalleler);
        }

        public async Task<IEnumerable<MahalleListDto>> GetByIlceIdAsync(int ilceId)
        {
            // return await _context.Mahalleler
            //     .AsNoTracking()
            //     .Where(x => x.IlceId == ilceId)
            //     .OrderBy(x => x.Ad)
            //     .Select(x => new MahalleListDto
            //     {
            //         Id = x.Id,
            //         Ad = x.Ad,
            //         IlceId = x.IlceId
            //     })
            //     .ToListAsync();

            var mahalleler = await _context.Mahalleler
                .AsNoTracking()
                .Where(x => x.IlceId == ilceId)
                .OrderBy(x => x.Ad)
                .ToListAsync();

            return _mapper.Map<IEnumerable<MahalleListDto>>(mahalleler);
        }
    }
}