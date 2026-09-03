using System.Collections.Generic;
using System.Threading.Tasks;
using REMS.API.DTOs.Ilce;

namespace REMS.API.Interfaces
{
    public interface IIlceService
    {
        Task<IEnumerable<IlceListDto>> GetByIlIdAsync(int ilId);
    }
}