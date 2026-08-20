import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
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
import { Style, Fill, Stroke } from 'ol/style';
import Overlay from 'ol/Overlay';

@Component({
  selector: 'app-tasinmaz-liste',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
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
  sayfalamaDizisi: number[] = [];
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
    public auth: Auth, // 👈 Auth servisini public ekliyoruz ki HTML'de auth.isAdmin kullanabilelim
    private ngZone: NgZone
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
      kullaniciId: [''] // 👈 Kullanıcı Filtresi
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

  private haritayiBaslat(): void {
    this.ngZone.runOutsideAngular(() => {
      this.vectorSource = new VectorSource();
      this.vectorLayer = new VectorLayer({
        source: this.vectorSource,
        style: new Style({ 
          fill: new Fill({
            color: 'rgba(51, 136, 255, 0.5)'
          }),
          stroke: new Stroke({
            color: 'blue',
            width: 2
          })
        })
      });
      this.map = new Map({
        target: 'map',
        layers: [new TileLayer({ source: new OSM() }), this.vectorLayer],
        view: new View({
          center: fromLonLat([32.85411, 39.92077]),
          zoom: 6
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

      this.map.on('singleclick', (evt) => {
        const feature = this.map.forEachFeatureAtPixel(evt.pixel, (f) => f);
        if (feature) {
          const bilgi = feature.get('tasinmazBilgi');
          if (bilgi) {
            this.secilenTasinmaz = bilgi;
            this.popupOverlay.setPosition(evt.coordinate);
            this.cdr.detectChanges();
          }
        } else {
          this.popupKapat();
        }
      });

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
    this.cdr.detectChanges();
  }

  private haritadaTasinmazaGit(tasinmaz: Tasinmaz): void {
    if (!this.map || !this.vectorSource) return;
    if (!tasinmaz.koordinatlar || tasinmaz.koordinatlar.length === 0) return;

    const koordinatlar = tasinmaz.koordinatlar.map(k => fromLonLat([k[0], k[1]]));
    const poligon = new Polygon([koordinatlar]);
    const feature = new Feature({
      geometry: poligon,
      tasinmazBilgi: tasinmaz
    });

    this.vectorSource.clear();
    this.vectorSource.addFeature(feature);
    this.map.getView().fit(poligon.getExtent(), {
      padding: [80, 80, 80, 80],
      duration: 800,
      maxZoom: 18
    });
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

        this.sayfalamaDizisi = Array.from({ length: this.totalPages }, (_, i) => i + 1);
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

  sayfaDegistir(yeniSayfa: number): void {
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

  secilenleriSil(): void {
    const secilenIdler = Array.from(this.seciliIdler);
    if (secilenIdler.length === 0) return;

    const onay = confirm(`${secilenIdler.length} adet taşınmazı silmek istediğinize emin misiniz?`);
    if (!onay) return;

    this.yukleniyor = true;
    this.tasinmazListeService.tasinmazlariSil(secilenIdler).subscribe({
      next: () => {
        this.seciliIdler.clear();
        this.tumSecili = false;
        this.veriGetir();
      },
      error: (hata) => {
        console.error('Taşınmazlar silinirken hata oluştu:', hata);
        alert('Taşınmazlar silinirken bir hata oluştu.');
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

  sil(id: number): void {
    const onay = confirm('Bu taşınmazı silmek istediğinize emin misiniz?');
    if (!onay) return;

    this.yukleniyor = true;
    this.tasinmazListeService.tasinmazSil(id).subscribe({
      next: () => {
        this.seciliIdler.delete(id);
        this.tumSecili = this.tasinmazlar.length > 0 && this.tasinmazlar.every(t => this.seciliIdler.has(t.id));
        this.veriGetir();
      },
      error: (hata) => {
        console.error('Taşınmaz silinirken hata oluştu:', hata);
        alert('Taşınmaz silinirken bir hata oluştu.');
        this.yukleniyor = false;
        this.cdr.detectChanges();
      }
    });
  }

  excelIndir(): void {
    const filtreler = { ...this.filtreForm.value };
    if (!this.auth.isAdmin && this.auth.currentUser) {
      filtreler.kullaniciId = this.auth.currentUser.id;
    }
    this.tasinmazListeService.exportToExcel(filtreler).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Tasinmazlar_${new Date().getTime()}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Excel indirilirken hata oluştu:', err);
        alert('Excel dosyası indirilirken bir hata oluştu.');
      }
    });
  }

  pdfIndir(): void {
    const filtreler = { ...this.filtreForm.value };
    if (!this.auth.isAdmin && this.auth.currentUser) {
      filtreler.kullaniciId = this.auth.currentUser.id;
    }
    this.tasinmazListeService.exportToPdf(filtreler).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Tasinmazlar_${new Date().getTime()}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('PDF indirilirken hata oluştu:', err);
        alert('PDF dosyası indirilirken bir hata oluştu.');
      }
    });
  }

  excelModalAcik = false;
  excelModalAc(): void { this.excelModalAcik = true; this.secilenExcelDosyasi = null; }
  excelModalKapat(): void { this.excelModalAcik = false; this.secilenExcelDosyasi = null; }

  excelDosyaSecildi(event: any): void {
    const dosya = event.target.files[0];
    if (dosya) {
      if (!dosya.name.endsWith('.xlsx')) {
        alert('Lütfen sadece .xlsx uzantılı Excel dosyası seçin!');
        event.target.value = '';
        this.secilenExcelDosyasi = null;
        return;
      }
      this.secilenExcelDosyasi = dosya;
    }
  }

  excelIceAktar(): void {
    if (!this.secilenExcelDosyasi) {
      alert('Lütfen önce bir Excel dosyası seçin.');
      return;
    }
    this.importYukleniyor = true;
    this.tasinmazListeService.importFromExcel(this.secilenExcelDosyasi).subscribe({
      next: (res: any) => {
        alert(res.message || 'Taşınmazlar başarıyla içe aktarıldı!');
        this.secilenExcelDosyasi = null;
        this.importYukleniyor = false;
        this.excelModalAcik = false;
        this.veriGetir();
      },
      error: (err: any) => {
        console.error('İçe aktarma hatası:', err);
        alert(err.error?.message || 'İçe aktarma başarısız oldu.');
        this.importYukleniyor = false;
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
}