import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TasinmazListeService } from './tasinmaz-liste.service';
import { Tasinmaz } from '../../models/tasinmaz.model';

// OpenLayers İçe Aktarımları
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke } from 'ol/style';

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

  // OpenLayers Harita ve Vektör Değişkenleri
  private map!: Map;
  private vectorSource!: VectorSource;
  private vectorLayer!: VectorLayer<VectorSource>;

  constructor(
    private tasinmazListeService: TasinmazListeService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.veriGetir();
  }

  ngAfterViewInit(): void {
    this.haritayiBaslat();
  }

  private haritayiBaslat(): void {
    // 1. Çizilecek poligonları tutacak kaynak ve katmanı oluşturuyoruz
    this.vectorSource = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: new Style({
        fill: new Fill({ color: 'rgba(51, 136, 255, 0.5)' }), // İç rengi ve saydamlık
        stroke: new Stroke({ color: 'blue', width: 2 })       // Kenar çizgisi
      })
    });

    // 2. OpenLayers Haritasını Başlatıyoruz
    this.map = new Map({
      target: 'map', // HTML'deki div id'si ile eşleşmeli
      layers: [
        new TileLayer({
          source: new OSM() // SRS gereksinimi: OpenStreetMap katmanı
        }),
        this.vectorLayer // Poligon katmanını haritanın üstüne ekliyoruz
      ],
      view: new View({
        center: fromLonLat([32.85411, 39.92077]), // Ankara merkezli başlatıyoruz
        zoom: 6
      })
    });
  }

  veriGetir(): void {
    this.tasinmazListeService.getTasinmazlar().subscribe({
      next: (veri) => {
        this.tasinmazlar = veri;
        this.yukleniyor = false;
        
        // Veriler başarıyla geldikten sonra haritaya çizilmesi için metodu çağırıyoruz
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

  private poligonlariCiz(): void {
    if (!this.map || !this.vectorSource) return;

    // Eski çizimleri temizle (listeyi yenilerken üst üste binmesin)
    this.vectorSource.clear();

    this.tasinmazlar.forEach(tasinmaz => {
      if (tasinmaz.koordinatlar && tasinmaz.koordinatlar.length > 0) {
        
        // C# Backend (X,Y) yani [Boylam, Enlem] gönderiyor.
        // OpenLayers koordinatları EPSG:3857 metrik sisteminde beklediği için dönüştürüyoruz.
        const donusturulmusKoordinatlar = tasinmaz.koordinatlar.map(k => fromLonLat([k[0], k[1]]));

        // Poligon geometrisini ve OpenLayers özelliğini (Feature) oluşturuyoruz
        const poligon = new Polygon([donusturulmusKoordinatlar]);
        const feature = new Feature({
          geometry: poligon,
          // İleride Popup (bilgi balonu) yapmak için taşınmaz bilgilerini özelliğe gömüyoruz
          tasinmazBilgi: tasinmaz 
        });

        // Oluşturulan şekli harita katmanına ekliyoruz
        this.vectorSource.addFeature(feature);
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