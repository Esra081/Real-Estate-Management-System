using System;

// 1. DÜZELTME: Sınıfı global alandan çıkarıp projeye özel bir ad alanına (namespace) dahil ettik.
namespace REMS.API.DTOs.Property 
{
    public class TasinmazUpdateDto
    {
        public int Id { get; set; } // Güncellenecek kaydın kimliği şarttır
        public string AdaNo { get; set; }
        public string ParselNo { get; set; }
        public string Adres { get; set; }
        public string TasinmazTipi { get; set; }
        public decimal AlanM2 { get; set; }
        public int MahalleId { get; set; }
        public Guid KullaniciId { get; set; }
        public double[][] Koordinatlar { get; set; }
    }
}