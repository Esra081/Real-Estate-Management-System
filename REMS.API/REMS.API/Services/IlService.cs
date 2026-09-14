using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using REMS.API.Data;
using REMS.API.DTOs.Il;
using REMS.API.Interfaces;

namespace REMS.API.Services
{
    public class IlService : IIlService
    {
        private readonly RemsDbContext _context;
        private readonly IMapper _mapper;

        public IlService(RemsDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<IlListDto>> GetAllAsync()
        {
            // return await _context.Iller
            //     .OrderBy(i => i.Id)
            //     .Select(i => new IlListDto { Id = i.Id, Ad = i.Ad })
            //     .ToListAsync();

            var iller = await _context.Iller
                .OrderBy(i => i.Id)
                .ToListAsync();

            return _mapper.Map<IEnumerable<IlListDto>>(iller);
        }
    }
}