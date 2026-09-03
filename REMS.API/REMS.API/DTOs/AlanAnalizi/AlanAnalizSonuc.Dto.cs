namespace REMS.API.DTOs.AlanAnalizi
{
    public class AlanAnalizSonucDto
    {
        public bool Basarili { get; set; }
        public string Mesaj { get; set; } = string.Empty;
        public string IslemTipi { get; set; } = string.Empty;
        public string? SonucEtiketi { get; set; }
        public decimal AlanM2 { get; set; }

        public List<List<double>> Koordinatlar { get; set; } = new();

        public List<List<List<double>>> CokluKoordinatlar { get; set; } = new();
    }
}