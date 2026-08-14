using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;
using System.Text.Json.Serialization;

namespace REMS.API.Entities
{
    public class Tasinmaz
    {
        public int Id { get; set; }

        [Column("kullanici_id")]
        public string? KullaniciId { get; set; }

        [Column("mahalle_id")]
        public int MahalleId { get; set; }

        [Column("ada_no")]
        public string? AdaNo { get; set; }

        [Column("parsel_no")]
        public string? ParselNo { get; set; }

        [Column("adres")]
        public string? Adres { get; set; }

        [Column("tasinmaz_tipi")]
        public string? TasinmazTipi { get; set; }

        [Column("alan_m2")]
        public decimal? AlanM2 { get; set; }

        [JsonIgnore]
        [Column("sinir")]
        public Polygon? Sinir { get; set; }

        public Mahalle? Mahalle { get; set; }
    }
}