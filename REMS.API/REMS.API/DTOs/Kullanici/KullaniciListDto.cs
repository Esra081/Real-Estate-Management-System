using System;

namespace REMS.API.DTOs.Kullanici
{
    public class KullaniciListDto
    {
        public Guid Id { get; set; }
        public string AdSoyad { get; set; }
        public string Email { get; set; }
        public string? Rol { get; set; }
        public DateTime OlusturmaTarihi { get; set; }
        public bool AktifMi { get; set; }
    }
}