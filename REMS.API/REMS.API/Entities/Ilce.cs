using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace REMS.API.Entities
{
    public class Ilce
    {
        [Key]
        public int Id { get; set; }
        public string Ad { get; set; }
        public int IlId { get; set; }
        public Il Il { get; set; }
        public ICollection<Mahalle> Mahalleler { get; set; }
    }
}