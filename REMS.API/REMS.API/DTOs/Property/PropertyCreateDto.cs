namespace REMS.API.DTOs.Property
{
    public class PropertyCreateDto
    {
        public string Ad { get; set; } = string.Empty;
        public string Aciklama { get; set; } = string.Empty;
        public int MahalleId { get; set; }
        public List<double[]> Koordinatlar { get; set; } = new List<double[]>();
    }
}