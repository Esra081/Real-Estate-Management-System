namespace REMS.API.DTOs.AlanAnalizi
{
    public class AlanAnalizSonucDto
    {
        public bool Basarili { get; set; }
        public string Mesaj { get; set; } = string.Empty;
        public string IslemTipi { get; set; } = string.Empty; // "A ∩ B", "A ∪ B" vb.
        public string? SonucEtiketi { get; set; } // "D" veya "E" veya "Kesişim"
        public decimal AlanM2 { get; set; }
        public List<List<double>> Koordinatlar { get; set; } = new();
    }
}