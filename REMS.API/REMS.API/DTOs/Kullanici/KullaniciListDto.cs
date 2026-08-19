using System;

namespace REMS.API.DTOs.Kullanici
{
    // Listeleme için kullanılan DTO
    public class KullaniciListDto
    {
        public Guid Id { get; set; }
        public string AdSoyad { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Rol { get; set; } = "Kullanici";
        public DateTime OlusturmaTarihi { get; set; }
        public bool AktifMi { get; set; } = true;
        public int TasinmazSayisi { get; set; }
    }

    // Yeni kullanıcı ekleme DTO'su
    public class KullaniciCreateDto
    {
        public string AdSoyad { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Sifre { get; set; } = string.Empty;
        public string Rol { get; set; } = "Kullanici";
    }

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