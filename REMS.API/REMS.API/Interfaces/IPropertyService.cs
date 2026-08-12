using REMS.API.DTOs.Property;

namespace REMS.API.Interfaces
{
    public interface IPropertyService
    {
        Task<bool> AddPropertyAsync(PropertyCreateDto model);
        Task<IEnumerable<PropertyListDto>> GetAllPropertiesAsync();
    }
}