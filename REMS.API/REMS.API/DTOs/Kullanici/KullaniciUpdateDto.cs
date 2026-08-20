using System;

namespace REMS.API.DTOs.Kullanici
{
    // Kullanıcı güncelleme DTO'su
    public class KullaniciUpdateDto
    {
        public Guid Id { get; set; }
        public string AdSoyad { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Rol { get; set; } = "Kullanici";
        public bool AktifMi { get; set; } = true;
        public string? YeniSifre { get; set; }
    }
}