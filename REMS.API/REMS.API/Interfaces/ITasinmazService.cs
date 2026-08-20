using REMS.API.DTOs;
using REMS.API.DTOs.Common;
using REMS.API.DTOs.Property;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace REMS.API.Interfaces
{
    public interface ITasinmazService
    {
        Task<IEnumerable<TasinmazListDto>> GetAllPropertiesAsync();
        Task<TasinmazListDto> GetPropertyByIdAsync(int id);
        Task<bool> AddPropertyAsync(TasinmazCreateDto model);
        Task<bool> UpdatePropertyAsync(TasinmazUpdateDto model);
        Task<bool> DeletePropertyAsync(int id);
        Task<bool> DeletePropertiesAsync(List<int> ids);
        Task<TasinmazPagedResponseDto> GetFilteredTasinmazlarAsync(TasinmazFilterDto filter);
    }
}