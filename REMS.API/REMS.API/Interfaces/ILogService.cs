using System.Threading.Tasks;
using REMS.API.DTOs.Common;
using REMS.API.DTOs.Log;

namespace REMS.API.Interfaces
{
    public interface ILogService
    {
        Task LogAsync(string islemTipi, string aciklama, string durum = "Basarili", string? kullaniciId = null, string? kullaniciEmail = null, string? ipAdresi = null);

        // 2. Admin paneli için filtrelenmiş sayfalı log listesi:
        Task<PagedResponseDto<LogListDto>> GetLogsAsync(LogFilterDto filter);
    }
}