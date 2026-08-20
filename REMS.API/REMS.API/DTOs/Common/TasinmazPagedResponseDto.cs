using REMS.API.DTOs.Property;

namespace REMS.API.DTOs.Common
{
    public class TasinmazPagedResponseDto : PagedResponseDto<TasinmazListDto>
    {
        public decimal TotalAreaM2 { get; set; }
        public int KonutCount { get; set; }
        public int ArsaCount { get; set; }
        public int BinaCount { get; set; }
        public string? TopCitiesSummary { get; set; }
    }
}