using System;
using System.ComponentModel.DataAnnotations;

namespace REMS.API.Entities
{
    public class Kullanici
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string AdSoyad { get; set; }

        [Required]
        public string Email { get; set; }

        public string SifreHash { get; set; }
        public string SifreSalt { get; set; }

        public string Rol { get; set; }

        public DateTime OlusturmaTarihi { get; set; }

        public bool AktifMi { get; set; }
    }
}