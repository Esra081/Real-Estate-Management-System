import { Component, OnInit, AfterViewInit } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
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
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tasinmaz.html',
  styleUrls: ['./tasinmaz.scss']
})
export class TasinmazFormComponent implements OnInit, AfterViewInit { // AfterViewInit eklendi

  tasinmazForm!: FormGroup;
  tasinmazId: number | null = null;
  duzenlemeModu = false;
  yukleniyor = false;

  iller: Il[] = [];
  ilceler: Ilce[] = [];
  mahalleler: Mahalle[] = [];

  // Dependency Injection: LokasyonService ve diğer servisleri buraya ekliyoruz
  constructor(
    private formBuilder: FormBuilder,
    private tasinmazService: TasinmazService,
    private lokasyonService: LokasyonService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.formOlustur();
    this.illerGetir(); // Artık hata vermeyecek, metodumuz aşağıda tanımlı

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
      kullaniciId: [this.auth.currentUser?.id || ''],
      koordinatlar: [[], Validators.required]
    });
  }

  // İlleri API'den çeken metot
  illerGetir(): void {
    this.lokasyonService.getIller().subscribe({
      next: (data: any) => {
        // BURAYI EKLEDİK: Backend'den gelen verinin yapısını konsola yazdırıyoruz
        console.log('API DEN GELEN İL VERİSİ:', data); 
        
        this.iller = data;
      },
      error: (hata) => {
        console.error('Hata:', hata.message);      }
    });
  }

  // İl seçildiğinde tetiklenecek metot (İlçeleri getirir)
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

  // İlçe seçildiğinde tetiklenecek metot (Mahalleleri getirir)
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

    console.log('DÜZENLENECEK TAŞINMAZ:', veri);

    // Önce temel taşınmaz bilgilerini forma doldur
    this.tasinmazForm.patchValue({
      adaNo: veri.adaNo,
      parselNo: veri.parselNo,
      adres: veri.adres,
      tasinmazTipi: veri.tasinmazTipi,
      alanM2: veri.alanM2,
      mahalleId: veri.mahalleId,
      kullaniciId: veri.kullaniciId,
      koordinatlar: veri.koordinatlar
    });

    // -----------------------------------
    // İL / İLÇE / MAHALLE
    // -----------------------------------

    console.log('İL:', veri.ilAdi);
    console.log('İLÇE:', veri.ilceAdi);
    console.log('MAHALLE:', veri.mahalleAdi);
    console.log('MAHALLE ID:', veri.mahalleId);

    // 1. Önce bütün illeri getir
    this.lokasyonService.getIller().subscribe({
      next: (iller: Il[]) => {

        this.iller = iller;

        // Gelen il adına göre ili bul
        const secilenIl = iller.find(
          il => il.ad === veri.ilAdi
        );

        if (!secilenIl) {
          console.error('İl bulunamadı:', veri.ilAdi);
          return;
        }

        console.log('SEÇİLEN İL:', secilenIl);

        // İl'i forma seç
        this.tasinmazForm.patchValue({
          ilId: secilenIl.id
        });

        // 2. Seçilen ilin ilçelerini getir
        this.lokasyonService.getIlceler(secilenIl.id).subscribe({
          next: (ilceler: Ilce[]) => {

            this.ilceler = ilceler;

            // Gelen ilçe adına göre ilçeyi bul
            const secilenIlce = ilceler.find(
              ilce => ilce.ad === veri.ilceAdi
            );

            if (!secilenIlce) {
              console.error('İlçe bulunamadı:', veri.ilceAdi);
              return;
            }

            console.log('SEÇİLEN İLÇE:', secilenIlce);

            // İlçeyi forma seç
            this.tasinmazForm.patchValue({
              ilceId: secilenIlce.id
            });

            // 3. Seçilen ilçenin mahallelerini getir
            this.lokasyonService.getMahalleler(secilenIlce.id).subscribe({
              next: (mahalleler: Mahalle[]) => {

                this.mahalleler = mahalleler;

                console.log(
                  'MAHALLELER:',
                  mahalleler
                );

                // Taşınmazın mahalle ID'sini bul
                const secilenMahalle = mahalleler.find(
                  mahalle => mahalle.id === veri.mahalleId
                );

                if (!secilenMahalle) {
                  console.error(
                    'Mahalle bulunamadı. Mahalle ID:',
                    veri.mahalleId
                  );
                  return;
                }

                console.log(
                  'SEÇİLEN MAHALLE:',
                  secilenMahalle
                );

                // Mahalleyi forma seç
                this.tasinmazForm.patchValue({
                  mahalleId: secilenMahalle.id
                });

                console.log(
                  'İL / İLÇE / MAHALLE OTOMATİK DOLDURULDU'
                );
              },

              error: (hata: any) => {
                console.error(
                  'Mahalleler yüklenemedi:',
                  hata
                );
              }
            });
          },

          error: (hata: any) => {
            console.error(
              'İlçeler yüklenemedi:',
              hata
            );
          }
        });
      },

      error: (hata: any) => {
        console.error(
          'İller yüklenemedi:',
          hata
        );
      }
    });

    // -----------------------------------
    // KOORDİNATLARI HARİTAYA ÇİZ
    // -----------------------------------

    if (
      veri.koordinatlar &&
      veri.koordinatlar.length >= 3
    ) {

      console.log(
        'API DEN GELEN KOORDİNATLAR:',
        veri.koordinatlar
      );

      // Harita henüz oluşturulmadıysa biraz bekle
      if (!this.vectorSource) {

        setTimeout(() => {
          this.koordinatlariHaritayaCiz(
            veri.koordinatlar
          );
        }, 300);

      } else {

        this.koordinatlariHaritayaCiz(
          veri.koordinatlar
        );
      }
    }
  },

  error: (hata: any) => {
    console.error(
      'Taşınmaz bilgileri alınamadı:',
      hata
       );
      }
    });
  }


  private koordinatlariHaritayaCiz(
    koordinatlar: number[][]
  ): void {

    if (!this.vectorSource || !this.map) {
      return;
    }

    console.log(
      'HARİTAYA ÇİZİLECEK KOORDİNATLAR:',
      koordinatlar
    );

    // Eski çizimi temizle
    this.vectorSource.clear();

    // Backend:
    // [longitude, latitude]
    //
    // OpenLayers:
    // EPSG:3857

    const transformedCoordinates = koordinatlar.map(
      (koordinat) =>
        fromLonLat([
          koordinat[0],
          koordinat[1]
        ])
    );

    // Polygon oluştur
    const polygon = new Polygon([
      transformedCoordinates
    ]);

    // Feature oluştur
    const feature = new Feature({
      geometry: polygon
    });

    // Haritaya ekle
    this.vectorSource.addFeature(feature);

    // Haritayı polygon'a odakla
    this.map.getView().fit(
      polygon.getExtent(),
      {
        padding: [50, 50, 50, 50],
        duration: 500,
        maxZoom: 18
      }
    );

    console.log(
      'Polygon haritaya çizildi.'
    );
  }
  

  kaydet(): void {
    console.log("🚀 Kaydet butonuna basıldı!");
    console.log("📋 Formun Geçerlilik Durumu (valid):", this.tasinmazForm.valid);

    if (this.tasinmazForm.invalid) {
      console.warn("❌ Form GEÇERSİZ! Eksik veya hatalı alanlar şunlar:");
      Object.keys(this.tasinmazForm.controls).forEach(key => {
        const control = this.tasinmazForm.get(key);
        if (control?.invalid) {
          console.log('  - Hatalı/Eksik Alan:', key, control.errors);
        }
      });
      this.tasinmazForm.markAllAsTouched();
      alert("Lütfen formdaki zorunlu alanları eksiksiz doldurun ve haritadan 4 nokta seçtiğinizden emin olun!");
      return;
    }

    console.log("✅ Form geçerli, API isteği hazırlanıyor...");

    const formVerisi = this.tasinmazForm.value;
    const aktifKullaniciId = this.auth.currentUser?.id || "00000000-0000-0000-0000-000000000001";

    const hazirTasinmazData = {
      id: 0,
      adaNo: formVerisi.adaNo,
      parselNo: formVerisi.parselNo,
      adres: formVerisi.adres,
      tasinmazTipi: formVerisi.tasinmazTipi,
      alanM2: Number(formVerisi.alanM2),
      mahalleId: Number(formVerisi.mahalleId), 
      kullaniciId: (this.duzenlemeModu && formVerisi.kullaniciId && formVerisi.kullaniciId.length > 20) ? formVerisi.kullaniciId : aktifKullaniciId,
      koordinatlar: formVerisi.koordinatlar
    };

if (this.duzenlemeModu && this.tasinmazId !== null) {
      // GÜNCELLEME İŞLEMİ
      const guncellenecekTasinmaz: Tasinmaz = {
        ...hazirTasinmazData, // ÖNCE hazır veriyi (id:0 dahil) seriyoruz
        id: this.tasinmazId   // SONRA gerçek ID ile o sıfırı eziyoruz!
      };

      console.log("SUNUCUYA GİDEN GÜNCELLEME VERİSİ:", guncellenecekTasinmaz);

      this.tasinmazService.tasinmazGuncelle(guncellenecekTasinmaz).subscribe({
        next: () => {
          alert('Taşınmaz başarıyla güncellendi.');
          this.router.navigate(['/tasinmaz-liste']);
        },
        error: (hata) => {
          console.error('Güncelleme hatası:', hata);
          alert('Taşınmaz güncellenirken bir hata oluştu.');
        }
      });

    } else {
      // EKLEME İŞLEMİ
      console.log("SUNUCUYA GİDEN EKLEME VERİSİ:", hazirTasinmazData);

      // Artık ham formVerisi'ni değil, hazırladığımız sayısal veriyi (hazirTasinmazData) gönderiyoruz
      this.tasinmazService.tasinmazEkle(hazirTasinmazData).subscribe({
        next: () => {
          alert('Taşınmaz başarıyla eklendi.');
          this.router.navigate(['/tasinmaz-liste']);
        },
        error: (hata) => {
          console.error('Ekleme hatası:', hata);
          alert('Taşınmaz eklenirken bir hata oluştu.');
        }
      });
    }
  }

  iptal(): void {
    this.router.navigate(['/tasinmaz-liste']);
  }

  // OpenLayers Harita Değişkenleri
  private map!: Map;
  private vectorSource!: VectorSource;
  private vectorLayer!: VectorLayer<VectorSource>;
  private drawInteraction!: Draw;

  // HTML DOM tamamen yüklendiğinde haritayı başlatıyoruz
  ngAfterViewInit(): void {
    this.haritayiBaslat();
  }

  private haritayiBaslat(): void {
    this.vectorSource = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource
    });

    this.map = new Map({
      target: 'draw-map', // HTML'de açacağımız div'in id'si ile aynı olmalı
      layers: [
        new TileLayer({
          source: new OSM() // SRS kuralı: OpenStreetMap altlığı
        }),
        this.vectorLayer
      ],
      view: new View({
        center: fromLonLat([32.85411, 39.92077]), // Ankara merkez
        zoom: 13
      })
    });

    this.cizimAraciniEkle();
  }

  private cizimAraciniEkle(): void {
    this.drawInteraction = new Draw({
      source: this.vectorSource,
      type: 'Polygon',
      maxPoints: 5, // SRS kuralı: Tam olarak 4 köşe + 1 kapatma noktası[cite: 1]
      minPoints: 5
    });

    this.drawInteraction.on('drawend', (event) => {
      this.vectorSource.clear(); // Tek bir taşınmaz alanı olması için eskisini siliyoruz

      const geometry = event.feature.getGeometry() as Polygon;
      const hamKoordinatlar = geometry.getCoordinates()[0];
      
      // Projeksiyon dönüşümü: EPSG:3857 -> EPSG:4326 [Boylam(X), Enlem(Y)]
      const veritabaniKoordinatlari = hamKoordinatlar.map(nokta => {
        const lonLat = toLonLat(nokta); 
        return [lonLat[0], lonLat[1]]; 
      });

      // Çizilen koordinatları Reactive Form içine aktarıyoruz
      this.tasinmazForm.patchValue({
        koordinatlar: veritabaniKoordinatlari
      });

      this.tasinmazForm.get('koordinatlar')?.markAsTouched();
      this.tasinmazForm.get('koordinatlar')?.updateValueAndValidity();
      
      console.log('📍 Haritadan Çizilen Koordinatlar:', veritabaniKoordinatlari);
    });

    this.map.addInteraction(this.drawInteraction);
  }
}