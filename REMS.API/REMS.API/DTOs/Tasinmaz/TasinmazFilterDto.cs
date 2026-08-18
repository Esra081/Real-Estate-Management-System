namespace REMS.API.DTOs
{
    public class TasinmazFilterDto
    {
        public int? IlId { get; set; }
        public int? IlceId { get; set; }
        public int? MahalleId { get; set; }

        public string? AdaNo { get; set; }
        public string? ParselNo { get; set; }
        public string? Adres { get; set; }
        public string? TasinmazTipi { get; set; }

        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}