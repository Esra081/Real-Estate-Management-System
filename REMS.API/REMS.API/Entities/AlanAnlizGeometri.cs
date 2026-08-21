using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;
using System.Text.Json.Serialization;

namespace REMS.API.Entities
{
    [Table("AlanAnalizGeometrileri")]
    public class AlanAnalizGeometri
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("kullanici_id")]
        public string? KullaniciId { get; set; }

        // Poligon etiketi: "A", "B", "C", "D" (A∪B sonucu), "E" (A∪B∪C sonucu)
        [Column("etiket")]
        [MaxLength(10)]
        public string Etiket { get; set; } = string.Empty;

        // Hesaplanmış yüzey alanı (m²)
        [Column("alan_m2")]
        public decimal? AlanM2 { get; set; }

        // PostGIS Mekansal Geometrisi (Polygon / MultiPolygon)
        [JsonIgnore]
        [Column("geometri")]
        public Geometry? Geometri { get; set; }

        [Column("olusturma_tarihi")]
        public DateTime OlusturmaTarihi { get; set; } = DateTime.UtcNow;
    }
}