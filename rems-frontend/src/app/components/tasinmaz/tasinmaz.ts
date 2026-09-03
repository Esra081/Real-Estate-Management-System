import { Component, OnInit, AfterViewInit } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { TasinmazService } from './tasinmaz.service';
import { Tasinmaz } from '../../models/tasinmaz.model';
import { LokasyonService } from '../../services/lokasyon.service';
import { Il } from '../../models/il.model';
import { Ilce } from '../../models/ilce.model';
import { Mahalle } from '../../models/mahalle.model';
import { Auth } from '../../core/auth';
import { ToastService } from '../../services/toast.service';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';

@Component({
  selector: 'app-tasinmaz',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './tasinmaz.html',
  styleUrls: ['./tasinmaz.scss']
})
export class TasinmazFormComponent implements OnInit, AfterViewInit {

  tasinmazForm!: FormGroup;
  tasinmazId: number | null = null;
  duzenlemeModu = false;
  yukleniyor = false;

  resimYuklemeTipi: 'dosya' | 'link' = 'dosya';
  secilenDosya: File | null = null;
  dosyaOnizlemeUrl: string | null = null;
  dosyaHataMesaji: string = '';

  iller: Il[] = [];
  ilceler: Ilce[] = [];
  mahalleler: Mahalle[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private tasinmazService: TasinmazService,
    private lokasyonService: LokasyonService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private auth: Auth,
    private toast: ToastService
  ) {}

    ngOnInit(): void {
    if (this.auth.isAdmin) {
      this.toast.warning('Yöneticiler taşınmaz ekleme veya düzenleme yapamaz.');
      this.router.navigate(['/tasinmaz-liste']);
      return;
    }

    this.formOlustur();
    this.illerGetir();

    const id = this.activatedRoute.snapshot.paramMap.get('id');

    if (id) {
      this.tasinmazId = Number(id);
      this.duzenlemeModu = true;
      this.tasinmazGetir(this.tasinmazId);
    }
  }

  formOlustur(): void {
    this.tasinmazForm = this.formBuilder.group({
      adaNo: ['', Validators.required],
      parselNo: ['', Validators.required],
      adres: ['', Validators.required],
      tasinmazTipi: ['', Validators.required],
      alanM2: [null, [Validators.required, Validators.min(0)]],
      ilId: ['', Validators.required],
      ilceId: ['', Validators.required],
      mahalleId: ['', Validators.required],
      resimUrl: [''],
      kullaniciId: [this.auth.currentUser?.id || ''],
      koordinatlar: [[], Validators.required]
    });
  }

  illerGetir(): void {
    this.lokasyonService.getIller().subscribe({
      next: (data: any) => {
        console.log('API DEN GELEN İL VERİSİ:', data); 
        
        this.iller = data;
      },
      error: (hata) => {
        console.error('Hata:', hata.message);      }
    });
  }

  onIlChange(event: any): void {
    const secilenIlId = event.target.value;
    
    this.ilceler = [];
    this.mahalleler = [];
    this.tasinmazForm.get('ilceId')?.setValue('');
    this.tasinmazForm.get('mahalleId')?.setValue('');

    if (secilenIlId) {
      this.lokasyonService.getIlceler(secilenIlId).subscribe({
        next: (data: Ilce[]) => {
          this.ilceler = data;
        },
        error: (hata) => {
          console.error('İlçeler yüklenirken hata oluştu:', hata);
        }
      });
    }
  }

  onIlceChange(event: any): void {
    const secilenIlceId = event.target.value;
    
    this.mahalleler = [];
    this.tasinmazForm.get('mahalleId')?.setValue('');

    if (secilenIlceId) {
      this.lokasyonService.getMahalleler(secilenIlceId).subscribe({
        next: (data: Mahalle[]) => {
          this.mahalleler = data;
        },
        error: (hata) => {
          console.error('Mahalleler yüklenirken hata oluştu:', hata);
        }
      });
    }
  }

  tasinmazGetir(id: number): void {
    this.yukleniyor = true;

    this.tasinmazService.getTasinmazById(id).subscribe({
      next: (veri: Tasinmaz) => {
        this.tasinmazForm.patchValue({
          adaNo: veri.adaNo,
          parselNo: veri.parselNo,
          adres: veri.adres,
          tasinmazTipi: veri.tasinmazTipi,
          alanM2: veri.alanM2,
          mahalleId: veri.mahalleId,
          resimUrl: veri.resimUrl || '',
          kullaniciId: veri.kullaniciId,
          koordinatlar: veri.koordinatlar
        });

        this.lokasyonService.getIller().subscribe({
          next: (iller: Il[]) => {
            this.iller = iller;
            const secilenIl = iller.find(il => il.ad === veri.ilAdi);
            if (!secilenIl) return;

            this.tasinmazForm.patchValue({ ilId: secilenIl.id });

            this.lokasyonService.getIlceler(secilenIl.id).subscribe({
              next: (ilceler: Ilce[]) => {
                this.ilceler = ilceler;
                const secilenIlce = ilceler.find(ilce => ilce.ad === veri.ilceAdi);
                if (!secilenIlce) return;

                this.tasinmazForm.patchValue({ ilceId: secilenIlce.id });

                this.lokasyonService.getMahalleler(secilenIlce.id).subscribe({
                  next: (mahalleler: Mahalle[]) => {
                    this.mahalleler = mahalleler;
                    const secilenMahalle = mahalleler.find(m => m.id === veri.mahalleId);
                    if (secilenMahalle) {
                      this.tasinmazForm.patchValue({ mahalleId: secilenMahalle.id });
                    }
                  }
                });
              }
            });
          }
        });

        if (veri.koordinatlar && veri.koordinatlar.length >= 3) {
          if (!this.vectorSource) {
            setTimeout(() => this.koordinatlariHaritayaCiz(veri.koordinatlar), 300);
          } else {
            this.koordinatlariHaritayaCiz(veri.koordinatlar);
          }
        }
      },
      error: (hata: any) => {
        console.error('Taşınmaz bilgileri alınamadı:', hata);
        this.toast.error('Taşınmaz bilgileri yüklenemedi.');
      }
    });
  }

  private koordinatlariHaritayaCiz(koordinatlar: number[][]): void {
    if (!this.vectorSource || !this.map) return;

    this.vectorSource.clear();

    const transformedCoordinates = koordinatlar.map(koordinat =>
      fromLonLat([koordinat[0], koordinat[1]])
    );

    const polygon = new Polygon([transformedCoordinates]);
    const feature = new Feature({ geometry: polygon });

    this.vectorSource.addFeature(feature);

    this.map.getView().fit(polygon.getExtent(), {
      padding: [50, 50, 50, 50],
      duration: 500,
      maxZoom: 18
    });
  }

  onDosyaSec(event: any): void {
    this.dosyaHataMesaji = '';
    const file = event.target.files?.[0];
    if (!file) {
      this.secilenDosya = null;
      this.dosyaOnizlemeUrl = null;
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(file.type) && ext !== 'jpg' && ext !== 'jpeg' && ext !== 'png') {
      this.dosyaHataMesaji = 'Yalnızca JPEG (.jpg, .jpeg) ve PNG (.png) formatındaki dosyalar yüklenebilir.';
      this.secilenDosya = null;
      this.dosyaOnizlemeUrl = null;
      event.target.value = '';
      return;
    }

    const maxBoyut = 100 * 1024 * 1024;
    if (file.size > maxBoyut) {
      this.dosyaHataMesaji = 'Dosya boyutu 100 MB sınırını aşamaz.';
      this.secilenDosya = null;
      this.dosyaOnizlemeUrl = null;
      event.target.value = '';
      return;
    }

    this.secilenDosya = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.dosyaOnizlemeUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  getGosterilecekResim(): string {
    if (this.resimYuklemeTipi === 'dosya' && this.dosyaOnizlemeUrl) {
      return this.dosyaOnizlemeUrl;
    }
    const formUrl = this.tasinmazForm?.get('resimUrl')?.value;
    if (formUrl) {
      return this.tasinmazService.getResimUrl(formUrl);
    }
    return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80';
  }

  kaydet(): void {
    if (this.tasinmazForm.invalid) {
      this.tasinmazForm.markAllAsTouched();
      this.toast.warning("Lütfen formdaki zorunlu alanları eksiksiz doldurun ve haritadan 4 nokta seçtiğinizden emin olun!");
      return;
    }

    const formVerisi = this.tasinmazForm.value;
    const aktifKullaniciId = this.auth.currentUser?.id || "00000000-0000-0000-0000-000000000001";

    const hazirTasinmazData = {
      id: this.duzenlemeModu && this.tasinmazId !== null ? this.tasinmazId : 0,
      adaNo: formVerisi.adaNo ? String(formVerisi.adaNo).trim() : '',
      parselNo: formVerisi.parselNo ? String(formVerisi.parselNo).trim() : '',
      adres: formVerisi.adres ? String(formVerisi.adres).trim() : '',
      tasinmazTipi: formVerisi.tasinmazTipi,
      alanM2: Number(formVerisi.alanM2) || 0,
      mahalleId: Number(formVerisi.mahalleId),
      resimUrl: this.resimYuklemeTipi === 'link' ? (formVerisi.resimUrl ? String(formVerisi.resimUrl).trim() : '') : (this.tasinmazForm.get('resimUrl')?.value || ''),
      kullaniciId: (this.duzenlemeModu && formVerisi.kullaniciId) ? formVerisi.kullaniciId : aktifKullaniciId,
      koordinatlar: formVerisi.koordinatlar
    };

    if (this.duzenlemeModu && this.tasinmazId !== null) {
      this.tasinmazService.tasinmazGuncelle(hazirTasinmazData).subscribe({
        next: (res: any) => {
          if (this.secilenDosya && this.tasinmazId) {
            this.tasinmazService.resimYukle(this.tasinmazId, this.secilenDosya).subscribe({
              next: () => {
                this.toast.success('Taşınmaz ve yeni fotoğrafı başarıyla güncellendi.');
                this.router.navigate(['/tasinmaz-liste']);
              },
              error: (fotoErr) => {
                console.error('Fotoğraf yükleme hatası:', fotoErr);
                const msg = fotoErr.error?.message || 'Fotoğraf yüklenemedi.';
                this.toast.warning(`Taşınmaz güncellendi ancak fotoğraf yüklenemedi: ${msg}`);
                this.router.navigate(['/tasinmaz-liste']);
              }
            });
          } else {
            if (res && res.hasChanges === false) {
              this.toast.info('Herhangi bir değişiklik yapılmadı.');
            } else {
              this.toast.success('Taşınmaz başarıyla güncellendi.');
            }
            this.router.navigate(['/tasinmaz-liste']);
          }
        },
        error: (hata) => {
          console.error('Güncelleme hatası:', hata);
          const detay = hata.error?.message || (typeof hata.error === 'string' ? hata.error : 'Taşınmaz güncellenirken bir hata oluştu.');
          this.toast.error(detay, 'Güncelleme Başarısız');
        }
      });

    } else {
      this.tasinmazService.tasinmazEkle(hazirTasinmazData).subscribe({
        next: (res: any) => {
          const yeniId = res?.id;
          if (this.secilenDosya && yeniId) {
            this.tasinmazService.resimYukle(yeniId, this.secilenDosya).subscribe({
              next: () => {
                this.toast.success('Taşınmaz ve fotoğrafı başarıyla eklendi.');
                this.router.navigate(['/tasinmaz-liste']);
              },
              error: (fotoErr) => {
                console.error('Fotoğraf yükleme hatası:', fotoErr);
                this.toast.warning('Taşınmaz eklendi ancak fotoğraf yüklenirken hata oluştu.');
                this.router.navigate(['/tasinmaz-liste']);
              }
            });
          } else {
            this.toast.success('Taşınmaz başarıyla eklendi.');
            this.router.navigate(['/tasinmaz-liste']);
          }
        },
        error: (hata) => {
          console.error('Ekleme hatası:', hata);
          const detay = hata.error?.message || (typeof hata.error === 'string' ? hata.error : 'Taşınmaz eklenirken bir hata oluştu.');
          this.toast.error(detay, 'Ekleme Başarısız');
        }
      });
    }
  }

  iptal(): void {
    this.router.navigate(['/tasinmaz-liste']);
  }

  private map!: Map;
  private vectorSource!: VectorSource;
  private vectorLayer!: VectorLayer<VectorSource>;
  private drawInteraction!: Draw;

  ngAfterViewInit(): void {
    this.haritayiBaslat();
  }

  private haritayiBaslat(): void {
    this.vectorSource = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource
    });

    this.map = new Map({
      target: 'draw-map',
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        this.vectorLayer
      ],
      view: new View({
        center: fromLonLat([32.85411, 39.92077]),
        zoom: 13
      })
    });

    this.cizimAraciniEkle();
  }

  private cizimAraciniEkle(): void {
    this.drawInteraction = new Draw({
      source: this.vectorSource,
      type: 'Polygon',
      maxPoints: 5,
      minPoints: 5
    });

    this.drawInteraction.on('drawend', (event) => {
      this.vectorSource.clear();

      const geometry = event.feature.getGeometry() as Polygon;
      const hamKoordinatlar = geometry.getCoordinates()[0];
      
      // Projeksiyon dönüşümü: EPSG:3857 -> EPSG:4326 [Boylam(X), Enlem(Y)]
      const veritabaniKoordinatlari = hamKoordinatlar.map(nokta => {
        const lonLat = toLonLat(nokta); 
        return [lonLat[0], lonLat[1]]; 
      });

      this.tasinmazForm.patchValue({
        koordinatlar: veritabaniKoordinatlari
      });

      this.tasinmazForm.get('koordinatlar')?.markAsTouched();
      this.tasinmazForm.get('koordinatlar')?.updateValueAndValidity();
    });

    this.map.addInteraction(this.drawInteraction);
  }
}