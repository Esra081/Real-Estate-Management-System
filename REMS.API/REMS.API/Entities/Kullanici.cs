using System;
using System.ComponentModel.DataAnnotations;

namespace REMS.API.Entities
{
    public class Kullanici
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string AdSoyad { get; set; } = string.Empty;

        [Required]
        public string Email { get; set; } = string.Empty;

        public string SifreHash { get; set; } = string.Empty;
        public string SifreSalt { get; set; } = string.Empty;

        public string Rol { get; set; } = "Kullanici";

        public DateTime OlusturmaTarihi { get; set; }

        public bool AktifMi { get; set; }
    }
}