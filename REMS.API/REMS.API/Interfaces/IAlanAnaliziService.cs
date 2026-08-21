using REMS.API.DTOs.AlanAnalizi;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace REMS.API.Interfaces
{
    public interface IAlanAnaliziService
    {
        // 1. Manuel çizilen A, B, C poligonlarını kaydeder
        Task<(bool Success, string Message)> KaydetGeometrilerAsync(List<PoligonDto> geometriler, string? kullaniciId);

        // 2. Auto-Select: Veritabanında kayıtlı A, B, C var mı kontrol edip getirir
        Task<List<PoligonDto>> GetAutoSelectGeometrilerAsync(string? kullaniciId);

        // 3. Kesişim: A ∩ B veya B ∩ A hesaplar (DB'ye kaydedilmez, sadece görselleştirilir)
        Task<AlanAnalizSonucDto> KesisimHesaplaAsync(string p1, string p2, List<PoligonDto>? geometriler, string? kullaniciId);

        // 4. Birleşim: A ∪ B (D) veya A ∪ B ∪ C (E) hesaplar ve D/E'yi DB'ye KAYDEDER
        Task<AlanAnalizSonucDto> BirlesimHesaplaAsync(List<string> etiketler, List<PoligonDto>? geometriler, string? kullaniciId);
    }
}