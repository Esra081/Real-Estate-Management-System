import * as L from 'leaflet';
// DÜZELTME 1: AfterViewInit buraya eklendi
import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TasinmazListeService } from './tasinmaz-liste.service';
import { Tasinmaz } from '../../models/tasinmaz.model';

@Component({
  selector: 'app-tasinmaz-liste',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tasinmaz-liste.html',
  styleUrls: ['./tasinmaz-liste.scss']
})
export class TasinmazListeComponent implements OnInit, AfterViewInit {
  tasinmazlar: Tasinmaz[] = [];
  yukleniyor = true;

  // DÜZELTME 2: map değişkeni constructor'ın içinden çıkarılıp sınıf seviyesine taşındı.
  // Çünkü L.Map bir Angular servisi değildir, normal bir değişkendir.
  private map: L.Map | undefined;

  constructor(
    private tasinmazListeService: TasinmazListeService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('TasinmazListeComponent başladı');
    this.veriGetir();
  }

  // HTML tamamen yüklendikten sonra haritayı başlatıyoruz
  ngAfterViewInit(): void {
    this.haritayiBaslat();
  }

  private haritayiBaslat(): void {
    // Haritayı oluşturup HTML'deki 'map' id'li div'e bağlıyoruz
    this.map = L.map('map').setView([39.92077, 32.85411], 6);

    // OpenStreetMap katmanı
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
  }

  veriGetir(): void {
    console.log('veriGetir çalıştı');

    this.tasinmazListeService.getTasinmazlar().subscribe({
      next: (veri) => {
        console.log('API verisi geldi:', veri);

        this.tasinmazlar = veri;
        this.yukleniyor = false;
        
        console.log('tasinmazlar:', this.tasinmazlar);
        console.log('yukleniyor:', this.yukleniyor);

        // DÜZELTME 3: Veriler API'den başarıyla geldikten sonra haritaya çizilmesi için metodu çağırıyoruz.
        this.poligonlariCiz();

        this.cdr.detectChanges();
      },

      error: (hata) => {
        console.error('Taşınmazlar yüklenirken hata oluştu:', hata);
        this.yukleniyor = false;
        this.cdr.detectChanges();
      }
    });
  }

  // EKSİK OLAN METOT EKLENDİ: Gelen koordinatları haritada çokgen (Polygon) olarak çizer
  private poligonlariCiz(): void {
    if (!this.map) return; // Harita yüklenmediyse işlemi durdur

    this.tasinmazlar.forEach(tasinmaz => {
      // Eğer bu taşınmazın bir sınırı/koordinatı varsa
      if (tasinmaz.koordinatlar && tasinmaz.koordinatlar.length > 0) {
        
        // C# Backend (X,Y) yani [Boylam, Enlem] gönderiyor.
        // Leaflet ise [Enlem, Boylam] bekliyor. Dizi elemanlarının yerini değiştiriyoruz.
        const leafletKoordinatlar: L.LatLngTuple[] = tasinmaz.koordinatlar.map(k => [k[1], k[0]] as L.LatLngTuple);

        // Poligonu oluşturup haritaya ekliyoruz
        const poligon = L.polygon(leafletKoordinatlar, {
          color: 'blue',      // Kenar çizgisi rengi
          fillColor: '#3388ff', // İç rengi
          fillOpacity: 0.5    // İç saydamlığı (0.0 ile 1.0 arası)
        }).addTo(this.map!);

        // Üzerine tıklandığında açılacak bilgilendirme balonu
        poligon.bindPopup(`
          <b>Ada No:</b> ${tasinmaz.adaNo} <br>
          <b>Parsel No:</b> ${tasinmaz.parselNo} <br>
          <b>Tip:</b> ${tasinmaz.tasinmazTipi}
        `);
      }
    });
  }

  yeniTasinmaz(): void {
    this.router.navigate(['/tasinmaz-ekle']);
  }

  duzenle(id: number): void {
    this.router.navigate(['/tasinmaz-duzenle', id]);
  }

  sil(id: number): void {
    const onay = confirm('Bu taşınmazı silmek istediğinize emin misiniz?');

    if (!onay) {
      return;
    }

    this.tasinmazListeService.tasinmazSil(id).subscribe({
      next: () => {
        this.veriGetir(); // Silindikten sonra listeyi yenile
      },

      error: (hata) => {
        console.error('Taşınmaz silinirken hata oluştu:', hata);
        alert('Taşınmaz silinirken bir hata oluştu.');
      }
    });
  }
}