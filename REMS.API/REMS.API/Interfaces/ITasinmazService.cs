using System.Collections.Generic;
using System.Threading.Tasks;
using REMS.API.DTOs.Property;

namespace REMS.API.Interfaces
{
    public interface ITasinmazService
    {
        Task<IEnumerable<TasinmazListDto>> GetAllPropertiesAsync();
        Task<TasinmazListDto> GetPropertyByIdAsync(int id);
        Task<bool> AddPropertyAsync(TasinmazCreateDto model);
        Task<bool> UpdatePropertyAsync(TasinmazUpdateDto model);
        Task<bool> DeletePropertyAsync(int id);
    }
}