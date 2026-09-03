using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace REMS.API.Entities
{
    public class Ilce
    {
        [Key]
        public int Id { get; set; }
        public string Ad { get; set; } = string.Empty;
        public int IlId { get; set; }
        public Il Il { get; set; } = null!;
        public ICollection<Mahalle> Mahalleler { get; set; } = new List<Mahalle>();
    }
}