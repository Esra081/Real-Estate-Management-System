using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using REMS.API.DTOs.Kullanici;

namespace REMS.API.Interfaces
{
    public interface IKullaniciService
    {
        Task<List<KullaniciListDto>> GetAllKullanicilarAsync();
        Task<KullaniciListDto?> GetKullaniciByIdAsync(Guid id);
        Task<(bool Success, string Message)> AddKullaniciAsync(KullaniciCreateDto model);
        Task<(bool Success, string Message)> UpdateKullaniciAsync(KullaniciUpdateDto model);
        Task<(bool Success, string Message)> DeleteKullaniciAsync(Guid id);
    }
}