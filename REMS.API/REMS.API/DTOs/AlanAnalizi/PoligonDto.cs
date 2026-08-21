namespace REMS.API.DTOs.AlanAnalizi
{
    public class PoligonDto
    {
        public string Etiket { get; set; } = string.Empty; // "A", "B", "C", "D", "E"
        public List<List<double>> Koordinatlar { get; set; } = new(); // [[lon, lat], [lon, lat], ...]
        public decimal? AlanM2 { get; set; }
    }
}
