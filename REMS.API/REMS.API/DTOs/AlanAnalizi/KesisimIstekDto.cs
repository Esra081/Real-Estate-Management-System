using System.Collections.Generic;

namespace REMS.API.DTOs.AlanAnalizi
{
    public class KesisimIstekDto
    {
        public string P1 { get; set; } = "A";
        public string P2 { get; set; } = "B";
        public List<PoligonDto>? Geometriler { get; set; }
    }
}
