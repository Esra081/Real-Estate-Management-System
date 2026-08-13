using System.Collections.Generic;
using System.Threading.Tasks;
using REMS.API.DTOs.Il;

namespace REMS.API.Interfaces
{
    public interface IIlService
    {
        Task<IEnumerable<IlListDTO>> GetAllAsync();
    }
}