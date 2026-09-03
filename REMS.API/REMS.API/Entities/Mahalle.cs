using System.ComponentModel.DataAnnotations;

namespace REMS.API.Entities
{
    public class Mahalle
    {
        [Key]
        public int Id { get; set; }
        public string Ad { get; set; } = string.Empty;
        public int IlceId { get; set; }
        public Ilce Ilce { get; set; } = null!;
    }
}