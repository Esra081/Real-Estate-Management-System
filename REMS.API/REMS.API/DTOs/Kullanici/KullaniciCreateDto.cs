namespace REMS.API.DTOs.Kullanici
{
    public class KullaniciCreateDto
    {
        public string AdSoyad { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Sifre { get; set; } = string.Empty;
        public string Rol { get; set; } = "Kullanici";
    }
}