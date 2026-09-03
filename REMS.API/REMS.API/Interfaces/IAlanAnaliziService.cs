using REMS.API.DTOs.AlanAnalizi;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace REMS.API.Interfaces
{
    public interface IAlanAnaliziService
    {
        Task<(bool Success, string Message)> KaydetGeometrilerAsync(List<PoligonDto> geometriler, string? kullaniciId);

        Task<List<PoligonDto>> GetAutoSelectGeometrilerAsync(string? kullaniciId);

        Task<AlanAnalizSonucDto> KesisimHesaplaAsync(string p1, string p2, List<PoligonDto>? geometriler, string? kullaniciId);

        Task<AlanAnalizSonucDto> BirlesimHesaplaAsync(List<string> etiketler, List<PoligonDto>? geometriler, string? kullaniciId);
    }
}