namespace REMS.API.DTOs.Property
{
    public class PropertyListDto
    {
        public int Id { get; set; }
        public string Ad { get; set; } = string.Empty;
        public string Aciklama { get; set; } = string.Empty;
        public int MahalleId { get; set; }

        // Haritaya (OpenLayers) göndereceğimiz [boylam, enlem] listesi
        public List<double[]> Koordinatlar { get; set; } = new List<double[]>();
    }
}