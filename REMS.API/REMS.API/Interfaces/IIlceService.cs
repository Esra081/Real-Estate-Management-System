using System.Collections.Generic;
using System.Threading.Tasks;
using REMS.API.DTOs.Ilce; // DTO referansı eklendi

namespace REMS.API.Interfaces
{
    public interface IIlceService
    {
        Task<IEnumerable<IlceListDTO>> GetByIlIdAsync(int ilId);
    }
}