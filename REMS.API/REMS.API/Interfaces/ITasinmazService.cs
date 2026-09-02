using Microsoft.AspNetCore.Http;
using REMS.API.DTOs;
using REMS.API.DTOs.Common;
using REMS.API.DTOs.Property;
using REMS.API.DTOs.Tasinmaz;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace REMS.API.Interfaces
{
    public interface ITasinmazService
    {
        Task<IEnumerable<TasinmazListDto>> GetAllPropertiesAsync();
        Task<TasinmazListDto?> GetPropertyByIdAsync(int id);
        Task<int> AddPropertyAsync(TasinmazCreateDto model);
        Task<UpdateResultDto> UpdatePropertyAsync(TasinmazUpdateDto model);
        Task<bool> DeletePropertyAsync(int id);
        Task<bool> DeletePropertiesAsync(List<int> ids);
        Task<TasinmazPagedResponseDto> GetFilteredTasinmazlarAsync(TasinmazFilterDto filter);
        Task<string> ResimYukleAsync(int tasinmazId, IFormFile dosya);
    }
}