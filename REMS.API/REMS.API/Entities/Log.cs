using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace REMS.API.Entities
{
    [Table("Loglar")]
    public class Log
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("kullanici_id")]
        public string? KullaniciId { get; set; }

        [Column("kullanici_email")]
        [MaxLength(150)]
        public string? KullaniciEmail { get; set; }

        [Column("islem_tipi")]
        [Required]
        [MaxLength(100)]
        public string IslemTipi { get; set; } = string.Empty;

        [Column("aciklama")]
        [Required]
        [MaxLength(500)]
        public string Aciklama { get; set; } = string.Empty;

        [Column("durum")]
        [Required]
        [MaxLength(20)]
        public string Durum { get; set; } = "Basarili";

        [Column("ip_adresi")]
        [MaxLength(50)]
        public string? IpAdresi { get; set; }

        [Column("tarih")]
        public DateTime Tarih { get; set; } = DateTime.UtcNow;
    }
}