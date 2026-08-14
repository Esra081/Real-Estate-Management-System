import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-tasinmaz',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tasinmaz.html',
  styleUrls: ['./tasinmaz.scss']
})
export class TasinmazFormComponent implements OnInit {

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
    private router: Router
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
      kullaniciId: ['', Validators.required],
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
        console.error('İller yüklenirken hata oluştu:', hata);
      }
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

        this.yukleniyor = false;
      },
      error: (hata) => {
        console.error('Taşınmaz getirilemedi:', hata);
        this.yukleniyor = false;
        alert('Taşınmaz bilgileri alınamadı.');
      }
    });
  }

  kaydet(): void {
    if (this.tasinmazForm.invalid) {
      this.tasinmazForm.markAllAsTouched();
      return;
    }

    const formVerisi = this.tasinmazForm.value;

    if (this.duzenlemeModu && this.tasinmazId !== null) {
      const guncellenecekTasinmaz: Tasinmaz = {
      id: this.tasinmazId,
      adaNo: formVerisi.adaNo,
      parselNo: formVerisi.parselNo,
      adres: formVerisi.adres,
      tasinmazTipi: formVerisi.tasinmazTipi,
      alanM2: Number(formVerisi.alanM2),
      mahalleId: Number(formVerisi.mahalleId),
      kullaniciId: formVerisi.kullaniciId,
      koordinatlar: formVerisi.koordinatlar
    };

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
      this.tasinmazService.tasinmazEkle(formVerisi).subscribe({
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
}