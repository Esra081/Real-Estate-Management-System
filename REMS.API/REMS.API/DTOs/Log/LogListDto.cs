using System;

namespace REMS.API.DTOs.Log
{
    public class LogListDto
    {
        public long Id { get; set; }
        public string? KullaniciId { get; set; }
        public string? KullaniciEmail { get; set; }
        public string? KullaniciAdi { get; set; }
        public string IslemTipi { get; set; } = string.Empty;
        public string Aciklama { get; set; } = string.Empty;
        public string Durum { get; set; } = string.Empty;
        public string? IpAdresi { get; set; }
        public DateTime Tarih { get; set; }
    }
}