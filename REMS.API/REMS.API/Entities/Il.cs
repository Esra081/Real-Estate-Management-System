using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace REMS.API.Entities
{
    public class Il
    {
        [Key]
        public int Id { get; set; }
        public string Ad { get; set; } = string.Empty;
        public ICollection<Ilce> Ilceler { get; set; } = new List<Ilce>();
    }
}