using System.Collections.Generic;

namespace REMS.API.DTOs.Property
{
    public class TasinmazCreateDto
    {
        // Kullanıcı ve Mahalle bağları
        public string KullaniciId { get; set; }
        public int MahalleId { get; set; }

        // Ada ve Parsel Bilgileri (varchar 30)
        public string AdaNo { get; set; }
        public string ParselNo { get; set; }

        // Açık Adres (varchar 300)
        public string Adres { get; set; }

        // Taşınmaz Tipi (Arsa / Bina / Konut)
        public string TasinmazTipi { get; set; }

        // Opsiyonel Alan (M2)
        public decimal? AlanM2 { get; set; }

        // Görsel / Fotoğraf URL (veya Dosya Yolu)
        public string? ResimUrl { get; set; }

        // PostGIS Poligonu için 4 nokta (X, Y koordinat dizisi)
        public List<List<double>> Koordinatlar { get; set; }
    }
}