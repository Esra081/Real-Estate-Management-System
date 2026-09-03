using System.Collections.Generic;

namespace REMS.API.DTOs.Property
{
    public class TasinmazCreateDto
    {
        public string KullaniciId { get; set; } = string.Empty;
        public int MahalleId { get; set; }

        public string AdaNo { get; set; } = string.Empty;
        public string ParselNo { get; set; } = string.Empty;

        public string Adres { get; set; } = string.Empty;

        public string TasinmazTipi { get; set; } = string.Empty;

        public decimal? AlanM2 { get; set; }

        public string? ResimUrl { get; set; }

        public List<List<double>> Koordinatlar { get; set; } = new();
    }
}