using System;

namespace REMS.API.DTOs.Log
{
    public class LogFilterDto
    {
        public string? KullaniciId { get; set; }
        public string? IslemTipi { get; set; }
        public string? Durum { get; set; }
        public DateTime? BaslangicTarihi { get; set; }
        public DateTime? BitisTarihi { get; set; }
        public string? IpAdresi { get; set; }
        public string? AramaMetni { get; set; }

        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}