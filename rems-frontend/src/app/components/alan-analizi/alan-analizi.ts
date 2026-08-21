import { Component, OnInit, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlanAnaliziService } from '../../services/alan-analizi.service';
import { PoligonDto, AlanAnalizSonucDto } from '../../models/alan-analizi.model';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Text } from 'ol/style';

@Component({
  selector: 'app-alan-analizi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alan-analizi.html',
  styleUrls: ['./alan-analizi.scss']
})
export class AlanAnaliziComponent implements OnInit, AfterViewInit {
  map!: Map;
  vectorSource = new VectorSource();
  vectorLayer!: VectorLayer<VectorSource>;
  drawInteraction: Draw | null = null;

  // Çizilen veya yüklenen poligonların hafızası
  aktifEtiket: 'A' | 'B' | 'C' | null = null;
  poligonlar: { [key: string]: PoligonDto } = {};

  // Sonuç ve UI durumları
  sonuc: AlanAnalizSonucDto | null = null;
  yukleniyor = false;
  mesaj: string | null = null;
  mesajTipi: 'success' | 'danger' | 'info' = 'info';

  constructor(
    private alanAnaliziService: AlanAnaliziService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.mapBaslat();
  }

  // 1. OpenLayers Haritasını Başlatma
  mapBaslat(): void {
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: (feature) => this.stilUret(feature)
    });

    this.map = new Map({
      target: 'alanAnaliziMap',
      layers: [
        new TileLayer({ source: new OSM() }),
        this.vectorLayer
      ],
      view: new View({
        center: fromLonLat([35.2433, 38.9637]), // Türkiye Merkezi
        zoom: 6
      })
    });
  }

  // 2. Haritada Çizim Başlatma (A, B veya C için)
  cizimBaslat(etiket: 'A' | 'B' | 'C'): void {
    this.cizimIptal();
    this.aktifEtiket = etiket;

    this.drawInteraction = new Draw({
      source: this.vectorSource,
      type: 'Polygon'
    });

    this.drawInteraction.on('drawend', (event) => {
      const feature = event.feature;
      const geom = feature.getGeometry() as Polygon;
      const coordinates = geom.getCoordinates()[0];

      // EPSG:3857'den GPS EPSG:4326 Enlem/Boylam formatına çeviriyoruz:
      const lonLatCoords = coordinates.map(c => toLonLat(c));

      feature.set('etiket', etiket);

      this.poligonlar[etiket] = {
        etiket: etiket,
        koordinatlar: lonLatCoords
      };

      this.cizimIptal();
      this.mesajGoster(`${etiket} Poligonu başarıyla çizildi.`, 'info');
      this.cdr.detectChanges();
    });

    this.map.addInteraction(this.drawInteraction);
    this.mesajGoster(`Lütfen harita üzerine tıklayarak '${etiket}' poligonunu çizin (Çift tıkla bitirin).`, 'info');
  }

  cizimIptal(): void {
    if (this.drawInteraction) {
      this.map.removeInteraction(this.drawInteraction);
      this.drawInteraction = null;
    }
    this.aktifEtiket = null;
  }

  // 3. Manuel Çizimleri Veritabanına Kaydetme
  cizimleriKaydet(): void {
    const liste = Object.values(this.poligonlar);
    if (liste.length === 0) {
      this.mesajGoster('Kaydedilecek çizim bulunamadı! Önce A, B veya C çizin.', 'danger');
      return;
    }

    this.yukleniyor = true;
    this.alanAnaliziService.kaydetGeometriler(liste).subscribe({
      next: (res) => {
        this.yukleniyor = false;
        this.mesajGoster(res.message || 'Çizimler başarıyla kaydedildi!', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.yukleniyor = false;
        this.mesajGoster(err.error?.message || 'Kaydetme sırasında hata oluştu.', 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  // 4. Auto-Select: Veritabanında Kayıtlı A, B, C'yi Getirme
  autoSelect(): void {
    this.yukleniyor = true;
    this.alanAnaliziService.getAutoSelectGeometriler().subscribe({
      next: (geometriler) => {
        this.yukleniyor = false;
        if (!geometriler || geometriler.length === 0) {
          this.mesajGoster('Veritabanında kayıtlı A, B veya C poligonu bulunamadı.', 'info');
          return;
        }

        this.haritayiTemizle();

        geometriler.forEach(g => {
          this.poligonlar[g.etiket] = g;
          this.poligonuHaritayaEkle(g.koordinatlar, g.etiket);
        });

        this.haritayiOdakla();
        this.mesajGoster(`${geometriler.length} adet kayıtlı poligon yüklendi (Auto-Select).`, 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.yukleniyor = false;
        this.mesajGoster('Kayıtlı geometriler yüklenirken hata oluştu.', 'danger');
      }
    });
  }

  // 5. Kesişim Analizi (A ∩ B)
  kesisimHesapla(p1 = 'A', p2 = 'B'): void {
    this.yukleniyor = true;
    const aktifCizimler = Object.values(this.poligonlar);

    this.alanAnaliziService.kesisimHesapla({ p1, p2, geometriler: aktifCizimler }).subscribe({
      next: (res) => {
        this.yukleniyor = false;
        this.sonuc = res;

        if (res.koordinatlar && res.koordinatlar.length > 0) {
          this.poligonuHaritayaEkle(res.koordinatlar, 'Kesişim');
          this.haritayiOdakla();
        }

        this.mesajGoster(res.mesaj, res.basarili ? 'success' : 'danger');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.yukleniyor = false;
        this.sonuc = null;
        this.mesajGoster(err.error?.mesaj || 'Kesişim hesaplanırken hata oluştu veya kesişim yok.', 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  // 6. Birleşim Analizi (A ∪ B -> D veya A ∪ B ∪ C -> E)
  birlesimHesapla(etiketler: string[]): void {
    this.yukleniyor = true;
    const aktifCizimler = Object.values(this.poligonlar);

    this.alanAnaliziService.birlesimHesapla({ etiketler, geometriler: aktifCizimler }).subscribe({
      next: (res) => {
        this.yukleniyor = false;
        this.sonuc = res;

        if (res.koordinatlar && res.koordinatlar.length > 0) {
          this.poligonuHaritayaEkle(res.koordinatlar, res.sonucEtiketi || 'Birleşim');
          this.haritayiOdakla();
        }

        this.mesajGoster(res.mesaj, res.basarili ? 'success' : 'danger');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.yukleniyor = false;
        this.sonuc = null;
        this.mesajGoster(err.error?.mesaj || 'Birleşim hesaplanırken hata oluştu.', 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  // Haritaya Poligon Çizme ve Odaklanma Yardımcıları
  private poligonuHaritayaEkle(koordinatlar: number[][], etiket: string): void {
    const transformed = koordinatlar.map(k => fromLonLat([k[0], k[1]]));
    const poly = new Polygon([transformed]);
    const feature = new Feature({ geometry: poly });
    feature.set('etiket', etiket);
    this.vectorSource.addFeature(feature);
  }

  haritayiTemizle(): void {
    this.cizimIptal();
    this.vectorSource.clear();
    this.poligonlar = {};
    this.sonuc = null;
    this.mesaj = null;
  }

  private haritayiOdakla(): void {
    const extent = this.vectorSource.getExtent();
    if (extent && isFinite(extent[0])) {
      this.map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 600, maxZoom: 18 });
    }
  }

  // Renk ve Stil Motoru
  private stilUret(feature: any): Style {
    const etiket = feature.get('etiket') || '';
    let fillColor = 'rgba(100, 116, 139, 0.4)';
    let strokeColor = '#475569';

    if (etiket === 'A') {
      fillColor = 'rgba(59, 130, 246, 0.4)';
      strokeColor = '#2563eb';
    } else if (etiket === 'B') {
      fillColor = 'rgba(34, 197, 94, 0.4)';
      strokeColor = '#16a34a';
    } else if (etiket === 'C') {
      fillColor = 'rgba(249, 115, 22, 0.4)';
      strokeColor = '#ea580c';
    } else if (etiket === 'Kesişim') {
      fillColor = 'rgba(239, 68, 68, 0.7)';
      strokeColor = '#b91c1c';
    } else if (etiket === 'D' || etiket === 'E') {
      fillColor = 'rgba(168, 85, 247, 0.5)';
      strokeColor = '#7e22ce';
    }

    return new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: strokeColor, width: 3 }),
      text: new Text({
        text: etiket,
        font: 'bold 15px sans-serif',
        fill: new Fill({ color: '#ffffff' }),
        stroke: new Stroke({ color: strokeColor, width: 3 }),
        offsetY: -5
      })
    });
  }

  private mesajGoster(msg: string, tip: 'success' | 'danger' | 'info'): void {
    this.mesaj = msg;
    this.mesajTipi = tip;
  }
}