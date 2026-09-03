namespace REMS.API.DTOs.AlanAnalizi
{
    public class PoligonDto
    {
        public string Etiket { get; set; } = string.Empty;
        public List<List<double>> Koordinatlar { get; set; } = new();
        public decimal? AlanM2 { get; set; }
    }
}
