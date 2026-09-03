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

        [Column("etiket")]
        [MaxLength(10)]
        public string Etiket { get; set; } = string.Empty;

        [Column("alan_m2")]
        public decimal? AlanM2 { get; set; }

        [JsonIgnore]
        [Column("geometri")]
        public Geometry? Geometri { get; set; }

        [Column("olusturma_tarihi")]
        public DateTime OlusturmaTarihi { get; set; } = DateTime.UtcNow;
    }
}