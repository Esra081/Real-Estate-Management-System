using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using REMS.API.Data;
using REMS.API.DTOs.Ilce;
using REMS.API.Interfaces;

namespace REMS.API.Services
{
    public class IlceService : IIlceService
    {
        private readonly RemsDbContext _context;
        private readonly IMapper _mapper;

        public IlceService(RemsDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<IlceListDto>> GetByIlIdAsync(int ilId)
        {
            // var ilceler = await _context.Ilceler
            //     .Where(i => i.IlId == ilId)
            //     .OrderBy(i => i.Ad)
            //     .Select(i => new IlceListDto { Id = i.Id, Ad = i.Ad, IlId = i.IlId })
            //     .ToListAsync();
            // return ilceler;

            var ilceler = await _context.Ilceler
                .Where(i => i.IlId == ilId)
                .OrderBy(i => i.Ad)
                .ToListAsync();

            return _mapper.Map<IEnumerable<IlceListDto>>(ilceler);
        }
    }
}