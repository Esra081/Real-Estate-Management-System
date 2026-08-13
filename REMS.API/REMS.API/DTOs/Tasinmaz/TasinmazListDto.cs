using System.Collections.Generic;

namespace REMS.API.DTOs.Property
{
    public class TasinmazListDto
    {
        public int Id { get; set; }
        public string? KullaniciId { get; set; }
        public int MahalleId { get; set; }

        public string? AdaNo { get; set; }
        public string? ParselNo { get; set; }
        public string? Adres { get; set; }
        public string? TasinmazTipi { get; set; }
        public decimal? AlanM2 { get; set; }

        public List<double[]>? Koordinatlar { get; set; }
    }
}