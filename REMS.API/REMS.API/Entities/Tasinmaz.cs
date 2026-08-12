using NetTopologySuite.Geometries;

namespace REMS.API.Entities
{
    public class Tasinmaz
    {
        public int Id { get; set; }

        public string Ad { get; set; } = string.Empty;

        public string Aciklama { get; set; } = string.Empty;

        public int MahalleId { get; set; }

        // Sadece PostGIS'in ve NTS'nin anladığı Coğrafi Alan tipi!
        public Polygon Sinir { get; set; } = null!;
    }
}