import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';

import { TasinmazListeService } from './tasinmaz-liste.service';
import { Tasinmaz } from '../../models/tasinmaz.model';
import { Il } from '../../models/il.model';
import { Ilce } from '../../models/ilce.model';
import { Mahalle } from '../../models/mahalle.model';
import { Kullanici } from '../../models/kullanici.model';
import { LokasyonService } from '../../services/lokasyon.service';
import { KullaniciService } from '../../services/kullanici.service';
import { Auth } from '../../core/auth';
import { OnayService } from '../../services/onay.service';
import { ToastService } from '../../services/toast.service';

// OpenLayers
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Icon, Text } from 'ol/style';
import Overlay from 'ol/Overlay';

@Component({
  selector: 'app-tasinmaz-liste',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './tasinmaz-liste.html',
  styleUrls: ['./tasinmaz-liste.scss']
})
export class TasinmazListeComponent implements OnInit, AfterViewInit {
  tasinmazlar: Tasinmaz[] = [];
  yukleniyor = true;
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  totalCount: number = 0;
  filtreForm!: FormGroup;
  iller: Il[] = [];
  ilceler: Ilce[] = [];
  mahalleler: Mahalle[] = [];
  tumKullanicilar: Kullanici[] = []; // Admin için kullanıcı listesi
  seciliIdler = new Set<number>();
  tumSecili = false;
  sayfalamaDizisi: (number | string)[] = [];
  private popupOverlay!: Overlay;
  secilenTasinmaz: Tasinmaz | null = null;
  secilenExcelDosyasi: File | null = null;
  importYukleniyor = false;
  genelToplamAlan: number = 0;
  genelKonutSayisi: number = 0;
  genelArsaSayisi: number = 0;
  genelBinaSayisi: number = 0;
  genelEnCokIller: string = 'Kayıt Yok';

  tasinmazTakip(index: number, tasinmaz: Tasinmaz): number {
    return tasinmaz.id;
  }

  sayfaTakip(index: number, sayfa: number): number {
    return sayfa;
  }

  readonly pinSvgKonut = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 46" width="36" height="46">
      <defs>
        <filter id="s" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M18 2 C9.16 2 2 9.16 2 18 C2 28 16 41.5 18 43 C20 41.5 34 28 34 18 C34 9.16 26.84 2 18 2 Z" fill="#2563eb" stroke="#ffffff" stroke-width="2" filter="url(#s)"/>
      <circle cx="18" cy="17" r="10" fill="#ffffff"/>
      <path d="M18 10.5 L12 16 L13.8 16 L13.8 22.5 L16.5 22.5 L16.5 18.5 L19.5 18.5 L19.5 22.5 L22.2 22.5 L22.2 16 L24 16 Z" fill="#2563eb"/>
    </svg>`
  );
  readonly pinSvgArsa = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 46" width="36" height="46">
      <defs>
        <filter id="s" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M18 2 C9.16 2 2 9.16 2 18 C2 28 16 41.5 18 43 C20 41.5 34 28 34 18 C34 9.16 26.84 2 18 2 Z" fill="#16a34a" stroke="#ffffff" stroke-width="2" filter="url(#s)"/>
      <circle cx="18" cy="17" r="10" fill="#ffffff"/>
      <path d="M14 13 L22 13 L24 21 L12 21 Z" fill="none" stroke="#16a34a" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M18 13 L18 21 M13 17 L23 17" stroke="#16a34a" stroke-width="1.2"/>
    </svg>`
  );
  readonly pinSvgBina = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 46" width="36" height="46">
      <defs>
        <filter id="s" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M18 2 C9.16 2 2 9.16 2 18 C2 28 16 41.5 18 43 C20 41.5 34 28 34 18 C34 9.16 26.84 2 18 2 Z" fill="#ea580c" stroke="#ffffff" stroke-width="2" filter="url(#s)"/>
      <circle cx="18" cy="17" r="10" fill="#ffffff"/>
      <path d="M13 11 L23 11 L23 23 L13 23 Z" fill="#ea580c"/>
      <rect x="15" y="13" width="2" height="2" fill="#ffffff"/>
      <rect x="19" y="13" width="2" height="2" fill="#ffffff"/>
      <rect x="15" y="16" width="2" height="2" fill="#ffffff"/>
      <rect x="19" y="16" width="2" height="2" fill="#ffffff"/>
      <rect x="17" y="19.5" width="2" height="3.5" fill="#ffffff"/>
    </svg>`
  );
  private readonly pinSvgDiger = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 46" width="36" height="46">
      <defs>
        <filter id="s" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M18 2 C9.16 2 2 9.16 2 18 C2 28 16 41.5 18 43 C20 41.5 34 28 34 18 C34 9.16 26.84 2 18 2 Z" fill="#64748b" stroke="#ffffff" stroke-width="2" filter="url(#s)"/>
      <circle cx="18" cy="17" r="10" fill="#ffffff"/>
      <circle cx="18" cy="17" r="4" fill="#64748b"/>
    </svg>`
  );

  private map!: Map;
  private vectorSource!: VectorSource;
  private vectorLayer!: VectorLayer<VectorSource>;

  constructor(
    private tasinmazListeService: TasinmazListeService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private lokasyonService: LokasyonService,
    private kullaniciService: KullaniciService,
    public auth: Auth,
    private ngZone: NgZone,
    private onay: OnayService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.filtreForm = this.fb.group({
      ilId: [''],
      ilceId: [''],
      mahalleId: [''],
      adaNo: [''],
      parselNo: [''],
      adres: [''],
      tasinmazTipi: [''],
      kullaniciId: [''] // Kullanici Filtresi
    });

    this.illeriGetir();

    // Admin ise filtrede göstermek için kullanıcıları çek
    if (this.auth.isAdmin) {
      this.kullaniciService.getKullanicilar().subscribe({
        next: (users) => {
          this.tumKullanicilar = users || [];
          this.cdr.detectChanges();
        }
      });
    }

    this.veriGetir();
  }

  ngAfterViewInit(): void {
    this.haritayiBaslat();
    if (this.tasinmazlar.length > 0) {
      this.poligonlariCiz();
    }
  }

  illeriGetir(): void {
    this.lokasyonService.getIller().subscribe({
      next: (data: Il[]) => {
        this.iller = data || [];
        this.cdr.detectChanges();
      },
      error: (hata) => {
        console.error('İller çekilirken hata oluştu!', hata);
      }
    });
  }

  ilSecildi(event: any): void {
    const ilId = event.target.value;
    this.filtreForm.patchValue({
      ilId: ilId,
      ilceId: '',
      mahalleId: ''
    });
    this.ilceler = [];
    this.mahalleler = [];

    if (ilId && ilId !== 'null' && ilId !== '') {
      this.lokasyonService.getIlceler(Number(ilId)).subscribe({
        next: (data) => {
          this.ilceler = data || [];
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('İlçeler yüklenemedi', err);
        }
      });
    }
  }

  ilceSecildi(event: any): void {
    const ilceId = event.target.value;
    this.filtreForm.patchValue({
      mahalleId: ''
    });
    this.mahalleler = [];

    if (ilceId && ilceId !== 'null' && ilceId !== '') {
      this.lokasyonService.getMahalleler(Number(ilceId)).subscribe({
        next: (data) => {
          this.mahalleler = data || [];
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Mahalleler yüklenemedi', err);
        }
      });
    }
  }

  secimDegistir(item: Tasinmaz, event: any): void {
    const isChecked = event.target.checked;
    item.secili = isChecked;
    if (isChecked) {
      this.seciliIdler.add(item.id);
    } else {
      this.seciliIdler.delete(item.id);
    }
    this.seciliIdler = new Set(this.seciliIdler);
    this.tumSecili = this.tasinmazlar.length > 0 && this.tasinmazlar.every(t => t.secili);
    this.cdr.detectChanges();
  }

  seciliMi(id: number): boolean {
    return this.seciliIdler.has(id);
  }

  tumunuSec(event: any): void {
    const isChecked = event.target.checked;
    this.tumSecili = isChecked;
    this.tasinmazlar.forEach(t => {
      t.secili = isChecked;
      if (isChecked) {
        this.seciliIdler.add(t.id);
      } else {
        this.seciliIdler.delete(t.id);
      }
    });
    if (!isChecked) {
      this.seciliIdler.clear();
    }
    this.seciliIdler = new Set(this.seciliIdler);
    this.cdr.detectChanges();
  }

  private getTasinmazStili(feature: any): Style[] {
    const tasinmaz: Tasinmaz = feature.get('tasinmazBilgi');
    const geom = feature.getGeometry();
    const isSelected = !!this.secilenTasinmaz && this.secilenTasinmaz.id === tasinmaz?.id;
    const zoom = this.map?.getView() ? (this.map.getView().getZoom() ?? 10) : 10;
    const tip = (tasinmaz?.tasinmazTipi || '').trim().toLowerCase();
    // 1. Taşınmaz türüne göre renk ve ikon seçimi
    let strokeColor = '#2563eb';
    let fillColor = 'rgba(37, 99, 235, 0.22)';
    let iconSrc = this.pinSvgKonut;
    if (tip === 'arsa') {
      strokeColor = '#16a34a';
      fillColor = 'rgba(22, 163, 74, 0.22)';
      iconSrc = this.pinSvgArsa;
    } else if (tip === 'bina') {
      strokeColor = '#ea580c';
      fillColor = 'rgba(234, 88, 12, 0.22)';
      iconSrc = this.pinSvgBina;
    } else if (tip !== 'konut') {
      strokeColor = '#64748b';
      fillColor = 'rgba(100, 116, 139, 0.22)';
      iconSrc = this.pinSvgDiger;
    }
    // Seçilen taşınmaz vurgusu (Altın-amber rengi)
    if (isSelected) {
      strokeColor = '#d97706';
      fillColor = 'rgba(217, 119, 6, 0.35)';
    }
    const styles: Style[] = [];
    // 2. Poligon Sınır ve Dolgu Stili
    const poligonStili = new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({
        color: strokeColor,
        width: isSelected ? 3.5 : (zoom >= 14 ? 2.5 : 1.8)
      }),
      zIndex: isSelected ? 100 : 10
    });
    styles.push(poligonStili);
    // 3. Poligon Merkezine Tür İkonu ve Ölçeğe Göre Etiket
    if (geom instanceof Polygon) {
      const centerPoint = geom.getInteriorPoint();
      // Zoom seviyesine göre pin boyutu (uzaktayken küçük, yakındayken normal)
      let pinScale = 0.85;
      if (zoom >= 15) {
        pinScale = 1.0;
      } else if (zoom >= 12) {
        pinScale = 0.92;
      }
      if (isSelected) {
        pinScale *= 1.15;
      }
      // Yakın zoom seviyesinde (zoom >= 14.5) ada/parsel etiketi
      let textStyle: Text | undefined = undefined;
      if (zoom >= 14.5 && tasinmaz) {
        textStyle = new Text({
          text: `Ada: ${tasinmaz.adaNo} / Parsel: ${tasinmaz.parselNo}`,
          font: 'bold 11px "Segoe UI", Roboto, sans-serif',
          fill: new Fill({ color: isSelected ? '#b45309' : '#0f172a' }),
          stroke: new Stroke({ color: '#ffffff', width: 3.5 }),
          offsetY: 24, // Pinin hemen altına yerleştirir
          overflow: true
        });
      }
      const iconStyle = new Style({
        geometry: centerPoint,
        image: new Icon({
          src: iconSrc,
          anchor: [0.5, 43 / 46],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          scale: pinScale
        }),
        text: textStyle,
        zIndex: isSelected ? 110 : 20
      });
      styles.push(iconStyle);
    }
    return styles;
  }

    private haritayiBaslat(): void {
    this.ngZone.runOutsideAngular(() => {
      this.vectorSource = new VectorSource();
      this.vectorLayer = new VectorLayer({
        source: this.vectorSource,
        style: (feature) => this.getTasinmazStili(feature)
      });

      this.map = new Map({
        target: 'map',
        layers: [new TileLayer({ source: new OSM() }), this.vectorLayer],
        view: new View({
          center: fromLonLat([32.85411, 39.92077]),
          zoom: 6 // Türkiye genel görünümü
        })
      });

      const popupElement = document.getElementById('popup');
      if (popupElement) {
        this.popupOverlay = new Overlay({
          element: popupElement,
          autoPan: {
            animation: {
              duration: 250
            }
          }
        });
        this.map.addOverlay(this.popupOverlay);
      }

      // Harita üzerinde bir pine veya parsele tıklandığında
      this.map.on('singleclick', (evt) => {
        const feature = this.map.forEachFeatureAtPixel(evt.pixel, (f) => f);
        if (feature) {
          const bilgi = feature.get('tasinmazBilgi');
          if (bilgi) {
            this.secilenTasinmaz = bilgi;
            // Seçim renginin (altın sarısı) parlaması için katmanı yenile
            if (this.vectorLayer) {
              this.vectorLayer.changed();
            }
            // Popup balonunu tam pinin/parselin merkezine yerleştir
            const geom = feature.getGeometry();
            if (geom instanceof Polygon) {
              this.popupOverlay.setPosition(geom.getInteriorPoint().getCoordinates());
            } else {
              this.popupOverlay.setPosition(evt.coordinate);
            }
            this.cdr.detectChanges();
          }
        } else {
          this.popupKapat();
        }
      });

      // Fare pinin üzerine geldiğinde imleci el işareti (pointer) yap
      this.map.on('pointermove', (evt) => {
        const hit = this.map.hasFeatureAtPixel(evt.pixel);
        this.map.getViewport().style.cursor = hit ? 'pointer' : '';
      });
    });
  }

  popupKapat(): void {
    if (this.popupOverlay) {
      this.popupOverlay.setPosition(undefined);
    }
    this.secilenTasinmaz = null;
    // Seçim kalktığı için katmanı normal renklere geri döndür
    if (this.vectorLayer) {
      this.vectorLayer.changed();
    }
    this.cdr.detectChanges();
  }

  haritadaTasinmazaGit(tasinmaz: Tasinmaz): void {
    if (!this.map || !this.vectorSource) return;
    if (!tasinmaz.koordinatlar || tasinmaz.koordinatlar.length === 0) return;

    this.secilenTasinmaz = tasinmaz;

    // Haritadaki feature'ı bul (veya yoksa ekle)
    const features = this.vectorSource.getFeatures();
    let hedefFeature = features.find(f => f.get('tasinmazBilgi')?.id === tasinmaz.id);

    if (!hedefFeature) {
      const koordinatlar = tasinmaz.koordinatlar.map(k => fromLonLat([k[0], k[1]]));
      const poligon = new Polygon([koordinatlar]);
      hedefFeature = new Feature({
        geometry: poligon,
        tasinmazBilgi: tasinmaz
      });
      this.vectorSource.addFeature(hedefFeature);
    }

    const geom = hedefFeature.getGeometry();
    if (geom) {
      // Haritayı yumuşak bir animasyonla parsele uçur
      this.map.getView().fit(geom.getExtent(), {
        padding: [90, 90, 90, 90],
        duration: 600,
        maxZoom: 17
      });

      // Popup'ı tam parselin merkezine aç
      if (geom instanceof Polygon && this.popupOverlay) {
        const center = geom.getInteriorPoint().getCoordinates();
        this.popupOverlay.setPosition(center);
      }
    }

    // Seçilen mülkü altın sarısıyla vurgula
    if (this.vectorLayer) {
      this.vectorLayer.changed();
    }
    this.cdr.detectChanges();
  }

  veriGetir(): void {
    this.yukleniyor = true;
    const formFiltreleri = this.filtreForm.value;
    
    const gidenFiltreler: any = {
      ...formFiltreleri,
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };

    // Eğer kullanıcı standart kullanıcı ise SADECE KENDİ MÜLKLERİNİ çeker!
    if (!this.auth.isAdmin && this.auth.currentUser) {
      gidenFiltreler.kullaniciId = this.auth.currentUser.id;
    }

    this.tasinmazListeService.getTasinmazlar(gidenFiltreler).subscribe({
      next: (response: any) => {
        if (response && response.data && Array.isArray(response.data)) {
          const totalP = response.totalPages || 1;
          if (response.data.length === 0 && this.currentPage > 1) {
            this.currentPage = Math.max(1, Math.min(this.currentPage - 1, totalP));
            this.veriGetir();
            return;
          }

          this.tasinmazlar = response.data;
          this.totalPages = totalP;
          this.totalCount = response.totalCount || response.data.length;
          this.currentPage = response.currentPage || 1;

                    this.genelToplamAlan = response.totalAreaM2 || 0;
          this.genelKonutSayisi = response.konutCount || 0;
          this.genelArsaSayisi = response.arsaCount || 0;
          this.genelBinaSayisi = response.binaCount || 0;
          this.genelEnCokIller = response.topCitiesSummary || 'Kayıt Yok';
          
        } else if (Array.isArray(response)) {
          this.tasinmazlar = response;
          this.totalPages = 1;
          this.totalCount = response.length;
        } else {
          this.tasinmazlar = [];
        }

        this.sayfalamaGuncelle();
        this.tasinmazlar.forEach(t => {
          t.secili = this.seciliIdler.has(t.id);
        });
        this.tumSecili = this.tasinmazlar.length > 0 && this.tasinmazlar.every(t => t.secili);
        this.yukleniyor = false;
        this.poligonlariCiz();
        this.cdr.detectChanges();
      },
      error: (hata) => {
        console.error('Veriler getirilirken hata oluştu:', hata);
        this.tasinmazlar = [];
        this.sayfalamaDizisi = [];
        this.tumSecili = false;
        this.yukleniyor = false;
        this.poligonlariCiz();
        this.cdr.detectChanges();
      }
    });
  }

  sayfalamaGuncelle(): void {
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      this.sayfalamaDizisi = Array.from({ length: total }, (_, i) => i + 1);
      return;
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    if (current <= 4) {
      for (let i = 2; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push('...');
      for (let i = total - 4; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push('...');
      pages.push(current - 1);
      pages.push(current);
      pages.push(current + 1);
      pages.push('...');
      pages.push(total);
    }

    this.sayfalamaDizisi = pages;
  }

  sayfaDegistir(yeniSayfa: number | string): void {
    if (typeof yeniSayfa === 'string' || yeniSayfa === this.currentPage) return;
    if (yeniSayfa >= 1 && yeniSayfa <= this.totalPages) {
      this.currentPage = yeniSayfa;
      this.veriGetir();
    }
  }

  filtrele(): void {
    this.currentPage = 1;
    this.veriGetir();
  }

  filtreyiTemizle(): void {
    this.filtreForm.reset({
      ilId: '',
      ilceId: '',
      mahalleId: '',
      adaNo: '',
      parselNo: '',
      adres: '',
      tasinmazTipi: '',
      kullaniciId: ''
    });

    this.ilceler = [];
    this.mahalleler = [];
    this.currentPage = 1;
    this.veriGetir();
  }

  private poligonlariCiz(): void {
    if (!this.map || !this.vectorSource) return;
    this.vectorSource.clear();

    this.tasinmazlar.forEach(tasinmaz => {
      if (tasinmaz.koordinatlar && tasinmaz.koordinatlar.length > 0) {
        const donusturulmusKoordinatlar = tasinmaz.koordinatlar.map(k => fromLonLat([k[0], k[1]]));
        const poligon = new Polygon([donusturulmusKoordinatlar]);
        const feature = new Feature({
          geometry: poligon,
          tasinmazBilgi: tasinmaz
        });
        this.vectorSource.addFeature(feature);
      }
    });
  }

  async secilenleriSil(): Promise<void> {
    const secilenIdler = Array.from(this.seciliIdler);
    if (secilenIdler.length === 0) return;

    const onay = await this.onay.sor(
      'Toplu Taşınmaz Silme',
      `Seçilen ${secilenIdler.length} adet taşınmazı ve haritadaki sınırlarını kalıcı olarak silmek istediğinize emin misiniz?`,
      'Evet, Hepsini Sil',
      'Vazgeç'
    );
    if (!onay) return;

    this.yukleniyor = true;
    this.cdr.detectChanges();
    this.tasinmazListeService.tasinmazlariSil(secilenIdler).subscribe({
      next: () => {
        this.toast.success(`${secilenIdler.length} adet taşınmaz başarıyla silindi.`);
        this.seciliIdler.clear();
        this.tumSecili = false;
        this.veriGetir();
      },
      error: (hata) => {
        console.error('Taşınmazlar silinirken hata oluştu:', hata);
        this.toast.error('Taşınmazlar silinirken bir hata oluştu.');
        this.yukleniyor = false;
        this.cdr.detectChanges();
      }
    });
  }

  yeniTasinmaz(): void {
    this.router.navigate(['/tasinmaz-ekle']);
  }

  duzenle(id: number): void {
    this.router.navigate(['/tasinmaz-duzenle', id]);
  }

  async sil(id: number): Promise<void> {
    const onay = await this.onay.sor(
      'Taşınmazı Sil',
      'Bu taşınmaz kaydı ve haritadaki sınırları kalıcı olarak silinecektir. Onaylıyor musunuz?',
      'Evet, Sil',
      'Vazgeç'
    );
    if (!onay) return;

    this.yukleniyor = true;
    this.cdr.detectChanges();
    this.tasinmazListeService.tasinmazSil(id).subscribe({
      next: () => {
        this.toast.success('Taşınmaz kaydı başarıyla silindi.');
        this.seciliIdler.delete(id);
        this.tumSecili = this.tasinmazlar.length > 0 && this.tasinmazlar.every(t => this.seciliIdler.has(t.id));
        this.veriGetir();
      },
      error: (hata) => {
        console.error('Taşınmaz silinirken hata oluştu:', hata);
        this.toast.error('Taşınmaz silinirken bir hata oluştu.');
        this.yukleniyor = false;
        this.cdr.detectChanges();
      }
    });
  }

  private aktifFiltreleriAl(): any {
    const formFiltreleri = this.filtreForm.value;
    const filtreler: any = {};

    if (formFiltreleri.ilId && formFiltreleri.ilId !== '' && formFiltreleri.ilId !== 'null') filtreler.ilId = formFiltreleri.ilId;
    if (formFiltreleri.ilceId && formFiltreleri.ilceId !== '' && formFiltreleri.ilceId !== 'null') filtreler.ilceId = formFiltreleri.ilceId;
    if (formFiltreleri.mahalleId && formFiltreleri.mahalleId !== '' && formFiltreleri.mahalleId !== 'null') filtreler.mahalleId = formFiltreleri.mahalleId;
    if (formFiltreleri.adaNo && formFiltreleri.adaNo.trim() !== '') filtreler.adaNo = formFiltreleri.adaNo.trim();
    if (formFiltreleri.parselNo && formFiltreleri.parselNo.trim() !== '') filtreler.parselNo = formFiltreleri.parselNo.trim();
    if (formFiltreleri.adres && formFiltreleri.adres.trim() !== '') filtreler.adres = formFiltreleri.adres.trim();
    if (formFiltreleri.tasinmazTipi && formFiltreleri.tasinmazTipi !== '') filtreler.tasinmazTipi = formFiltreleri.tasinmazTipi;

    if (!this.auth.isAdmin && this.auth.currentUser) {
      filtreler.kullaniciId = this.auth.currentUser.id;
    } else if (formFiltreleri.kullaniciId && formFiltreleri.kullaniciId !== '') {
      filtreler.kullaniciId = formFiltreleri.kullaniciId;
    }

    return filtreler;
  }

  excelIndir(): void {
    const filtreler = this.aktifFiltreleriAl();
    this.tasinmazListeService.exportToExcel(filtreler).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Tasinmazlar_${new Date().getTime()}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('Excel raporu başarıyla indirildi.');
      },
      error: (err) => {
        console.error('Excel indirilirken hata oluştu:', err);
        this.toast.error('Excel dosyası indirilirken bir hata oluştu.');
      }
    });
  }

  pdfIndir(): void {
    const filtreler = this.aktifFiltreleriAl();
    this.tasinmazListeService.exportToPdf(filtreler).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Tasinmazlar_${new Date().getTime()}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('PDF raporu başarıyla indirildi.');
      },
      error: (err) => {
        console.error('PDF indirilirken hata oluştu:', err);
        this.toast.error('PDF dosyası indirilirken bir hata oluştu.');
      }
    });
  }

  excelModalAcik = false;
  importHataMesaji: string | null = null;
  private importSubscription?: Subscription;

  excelModalAc(): void { 
    this.excelModalAcik = true; 
    this.secilenExcelDosyasi = null;
    this.importYukleniyor = false;
    this.importHataMesaji = null;
    this.cdr.detectChanges();
  }

  excelModalKapat(): void { 
    if (this.importSubscription) {
      this.importSubscription.unsubscribe();
      this.importSubscription = undefined;
    }
    this.excelModalAcik = false; 
    this.secilenExcelDosyasi = null;
    this.importYukleniyor = false;
    this.importHataMesaji = null;
    this.cdr.detectChanges();
  }

  excelDosyaSecildi(event: any): void {
    this.importHataMesaji = null;
    const dosya = event.target?.files?.[0];
    if (dosya) {
      if (!dosya.name.toLowerCase().endsWith('.xlsx')) {
        this.toast.warning('Lütfen sadece .xlsx uzantılı Excel dosyası seçin!');
        event.target.value = '';
        this.secilenExcelDosyasi = null;
        this.cdr.detectChanges();
        return;
      }
      this.secilenExcelDosyasi = dosya;
      this.cdr.detectChanges();
    } else {
      this.secilenExcelDosyasi = null;
      this.cdr.detectChanges();
    }
  }

  excelIceAktar(): void {
    if (!this.secilenExcelDosyasi) {
      this.toast.warning('Lütfen önce bir Excel dosyası seçin.');
      return;
    }
    this.importYukleniyor = true;
    this.importHataMesaji = null;
    this.cdr.detectChanges();

    this.importSubscription = this.tasinmazListeService.importFromExcel(this.secilenExcelDosyasi).subscribe({
      next: (res: any) => {
        this.toast.success(res.message || 'Taşınmazlar başarıyla içe aktarıldı!');
        this.secilenExcelDosyasi = null;
        this.importYukleniyor = false;
        this.importHataMesaji = null;
        this.excelModalAcik = false;
        this.veriGetir();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('İçe aktarma hatası:', err);
        const mesaj = err.error?.message || err.message || 'İçe aktarma başarısız oldu.';
        this.toast.error(mesaj);
        this.importHataMesaji = mesaj;
        this.importYukleniyor = false;
        this.cdr.detectChanges();
      }
    });
  }

  get tipDagilimi(): { konut: number; arsa: number; bina: number; diger: number } {
    let konut = 0, arsa = 0, bina = 0, diger = 0;
    if (this.tasinmazlar) {
      this.tasinmazlar.forEach(t => {
        const tip = (t.tasinmazTipi || '').toLowerCase().trim();
        if (tip === 'konut') konut++;
        else if (tip === 'arsa') arsa++;
        else if (tip === 'bina') bina++;
        else diger++;
      });
    }
    return { konut, arsa, bina, diger };
  }

  haritadaGoster(item: Tasinmaz): void {
    this.secilenTasinmaz = item;
    this.haritadaTasinmazaGit(item);
    if (this.popupOverlay && item.koordinatlar && item.koordinatlar.length > 0) {
      const ilkNokta = fromLonLat([item.koordinatlar[0][0], item.koordinatlar[0][1]]);
      this.popupOverlay.setPosition(ilkNokta);
    }
    this.cdr.detectChanges();
  }

  get toplamAlan(): number {
    return (this.tasinmazlar || []).reduce((toplam, t) => toplam + (Number(t.alanM2) || 0), 0);
  }
  get benzersizIlSayisi(): number {
    const iller = new Set((this.tasinmazlar || []).map(t => t.ilAdi).filter(Boolean));
    return iller.size;
  }
  get enCokBulunanIller(): string {
    if (!this.tasinmazlar || this.tasinmazlar.length === 0) return 'Kayıt Yok';
    const ilSayilari: { [key: string]: number } = {};
    this.tasinmazlar.forEach(t => {
      const il = t.ilAdi || 'Belirtilmemiş';
      ilSayilari[il] = (ilSayilari[il] || 0) + 1;
    });
    return Object.entries(ilSayilari)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([il, sayi]) => `${il} (${sayi})`)
      .join(', ');
  }
  get konutSayisi(): number {
    return (this.tasinmazlar || []).filter(t => t.tasinmazTipi?.toLowerCase() === 'konut').length;
  }
  get arsaSayisi(): number {
    return (this.tasinmazlar || []).filter(t => t.tasinmazTipi?.toLowerCase() === 'arsa').length;
  }
  get binaSayisi(): number {
    return (this.tasinmazlar || []).filter(t => t.tasinmazTipi?.toLowerCase() === 'bina').length;
  }

  getResimUrl(url?: string): string {
    return this.tasinmazListeService.getResimUrl(url);
  }
}