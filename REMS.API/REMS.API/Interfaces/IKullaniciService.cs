using System.Collections.Generic;
using System.Threading.Tasks;
using REMS.API.DTOs.Kullanici;

namespace REMS.API.Interfaces
{
    public interface IKullaniciService
    {
        Task<IEnumerable<KullaniciListDto>> GetKullanicilarAsync();
    }
}