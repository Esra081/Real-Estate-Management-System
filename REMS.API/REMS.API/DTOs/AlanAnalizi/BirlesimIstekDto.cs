using System.Collections.Generic;

namespace REMS.API.DTOs.AlanAnalizi
{
    public class BirlesimIstekDto
    {
        public List<string> Etiketler { get; set; } = new();
        public List<PoligonDto>? Geometriler { get; set; }
    }
}
