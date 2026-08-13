using REMS.API.DTOs.Mahalle;

namespace REMS.API.Interfaces
{
    public interface IMahalleService
    {
        Task<IEnumerable<MahalleListDto>> GetAllAsync();
        Task<IEnumerable<MahalleListDto>> GetByIlceIdAsync(int ilceId);
    }
}