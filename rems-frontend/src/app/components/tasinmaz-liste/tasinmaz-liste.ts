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
import { LokasyonService } from '../../services/lokasyon.service';

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
  seciliIdler = new Set<number>();
  tumSecili = false;
  sayfalamaDizisi: number[] = [];

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
      tasinmazTipi: ['']
    });
    this.illeriGetir();
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
        console.log('Backendden gelen iller:', data);
        this.iller = data;
      },

      error: (hata) => {
        console.error(
          'İller çekilirken hata oluştu!',
          hata
        );
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

    if (
      ilId &&
      ilId !== 'null' &&
      ilId !== ''
    ) {

      this.lokasyonService.getIlceler(ilId).subscribe({

        next: (data) => {
          this.ilceler = data;
        },

        error: (err) => {
          console.error(
            'İlçeler yüklenemedi',
            err
          );
        }
      });
    }
  }


  ilceSecildi(event: any): void {

    const ilceId = event.target.value;

    // İlçe değiştiğinde mahalleyi temizle
    this.filtreForm.patchValue({
      mahalleId: ''
    });

    this.mahalleler = [];

    if (
      ilceId &&
      ilceId !== 'null' &&
      ilceId !== ''
    ) {

      this.lokasyonService
        .getMahalleler(ilceId)
        .subscribe({

          next: (data) => {
            this.mahalleler = data;
          },

          error: (err) => {
            console.error(
              'Mahalleler yüklenemedi',
              err
            );
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
    });
  }

  private haritadaTasinmazaGit(tasinmaz: Tasinmaz): void {
    if (!this.map || !this.vectorSource) {
      return;
    }

    if (!tasinmaz.koordinatlar || tasinmaz.koordinatlar.length === 0) {
      console.warn(
        'Seçilen taşınmazın koordinatı bulunamadı:',
        tasinmaz.id
      );
      return;
    }

    const koordinatlar = tasinmaz.koordinatlar.map(k =>
      fromLonLat([k[0], k[1]])
    );
    const poligon = new Polygon([koordinatlar]);
    const feature = new Feature({
      geometry: poligon,
      tasinmazBilgi: tasinmaz
    });

    this.vectorSource.clear();
    this.vectorSource.addFeature(feature);
    // Haritayı taşınmaza yaklaştır
    this.map.getView().fit(poligon.getExtent(), {
      padding: [80, 80, 80, 80],
      duration: 800,
      maxZoom: 18
    });
  }


  veriGetir(): void {
    this.yukleniyor = true;
    const formFiltreleri =
      this.filtreForm.value;
    const gidenFiltreler = {
      ...formFiltreleri,
      pageNumber:
        this.currentPage,
      pageSize:
        this.pageSize
    };

    this.tasinmazListeService
      .getTasinmazlar(gidenFiltreler)
      .subscribe({
        next: (response: any) => {
          if (response) {
            // PagedResponse
            if (
              response.data &&
              Array.isArray(response.data)
            ) {
              const totalP = response.totalPages || 1;

              // Eğer bu sayfadaki tüm kayıtlar silindiyse ve önceki sayfa varsa, otomatik olarak önceki sayfayı getir
              if (response.data.length === 0 && this.currentPage > 1) {
                this.currentPage = Math.max(1, Math.min(this.currentPage - 1, totalP));
                this.veriGetir();
                return;
              }

              this.tasinmazlar =
                response.data;
              this.totalPages =
                totalP;
              this.totalCount =
                response.totalCount ||
                response.data.length;
              this.currentPage =
                response.currentPage || 1;
            }

            else if (
              Array.isArray(response)
            ) {
              this.tasinmazlar =
                response;
              this.totalPages = 1;
              this.totalCount =
                response.length;
            }
            else {
              this.tasinmazlar = [];
            }
          } else {
            this.tasinmazlar = [];
          }
          this.sayfalamaDizisi = Array.from(
            { length: this.totalPages },
            (_, i) => i + 1
          );
          this.tasinmazlar.forEach(t => {
            t.secili = this.seciliIdler.has(t.id);
          });
          this.tumSecili = this.tasinmazlar.length > 0 && this.tasinmazlar.every(t => t.secili);
          this.yukleniyor = false;
          this.poligonlariCiz();
          this.cdr.detectChanges();
        },

        error: (hata) => {
          console.error(
            'Veriler getirilirken hata oluştu:',
            hata
          );
          this.tasinmazlar = [];
          this.sayfalamaDizisi = [];
          this.tumSecili = false;
          this.yukleniyor = false;
          this.poligonlariCiz();
          this.cdr.detectChanges();
        }
      });
  }

  sayfaDegistir(
    yeniSayfa: number
  ): void {
    if (
      yeniSayfa >= 1 &&
      yeniSayfa <= this.totalPages
    ) {
      this.currentPage =
        yeniSayfa;

      this.veriGetir();
    }
  }

  filtrele(): void {

    console.log(
      'Filtrele butonuna basıldı, güncel form:',
      this.filtreForm.value
    );

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
      tasinmazTipi: ''
    });

    this.ilceler = [];
    this.mahalleler = [];
    this.currentPage = 1;
    this.veriGetir();
  }

  private poligonlariCiz(): void {
    if (
      !this.map ||
      !this.vectorSource
    ) {
      return;
    }

    this.vectorSource.clear();

    this.tasinmazlar.forEach(
      tasinmaz => {
        if (
          tasinmaz.koordinatlar &&
          tasinmaz.koordinatlar.length > 0
        ) {
          const donusturulmusKoordinatlar =
            tasinmaz.koordinatlar.map(
              k =>
                fromLonLat([
                  k[0],
                  k[1]
                ])
            );

          const poligon =
            new Polygon([
              donusturulmusKoordinatlar
            ]);


          const feature =
            new Feature({
              geometry: poligon,
              tasinmazBilgi:
                tasinmaz
            });

          this.vectorSource
            .addFeature(feature);
        }
      }
    );
  }

  secilenleriSil(): void {
    const secilenIdler = Array.from(this.seciliIdler);
    if (secilenIdler.length === 0) {
      return;
    }

    const onay = confirm(
      `${secilenIdler.length} adet taşınmazı silmek istediğinize emin misiniz?`
    );

    if (!onay) {
      return;
    }

    this.yukleniyor = true;
    this.tasinmazListeService
      .tasinmazlariSil(secilenIdler)
      .subscribe({
        next: () => {
          this.seciliIdler.clear();
          this.tumSecili = false;
          this.veriGetir();
        },
        error: (hata) => {
          console.error(
            'Taşınmazlar silinirken hata oluştu:',
            hata
          );
          alert('Taşınmazlar silinirken bir hata oluştu.');
          this.yukleniyor = false;
          this.cdr.detectChanges();
        }
      });
  }

  yeniTasinmaz(): void {
    this.router.navigate([
      '/tasinmaz-ekle'
    ]);
  }

  duzenle(id: number): void {

    this.router.navigate([
      '/tasinmaz-duzenle',
      id
    ]);
  }

  sil(id: number): void {

    const onay = confirm(
      'Bu taşınmazı silmek istediğinize emin misiniz?'
    );

    if (!onay) {
      return;
    }

    this.yukleniyor = true;
    this.tasinmazListeService
      .tasinmazSil(id)
      .subscribe({
        next: () => {
          this.seciliIdler.delete(id);
          this.tumSecili = this.tasinmazlar.length > 0 && this.tasinmazlar.every(t => this.seciliIdler.has(t.id));
          this.veriGetir();
        },
        error: (hata) => {
          console.error(
            'Taşınmaz silinirken hata oluştu:',
            hata
          );
          alert(
            'Taşınmaz silinirken bir hata oluştu.'
          );
          this.yukleniyor = false;
          this.cdr.detectChanges();
        }
      });
  }
}