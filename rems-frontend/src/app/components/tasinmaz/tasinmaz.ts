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

  constructor(
    private formBuilder: FormBuilder,
    private tasinmazService: TasinmazService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.formOlustur();

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
      mahalleId: [null, Validators.required],
      kullaniciId: ['', Validators.required],
      koordinatlar: [[], Validators.required]
    });
  }

  tasinmazGetir(id: number): void {
    this.yukleniyor = true;

    this.tasinmazService.getTasinmazById(id).subscribe({
      next: (veri: Tasinmaz) => {

        this.tasinmazForm.setValue({
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
        ...formVerisi
      };

      this.tasinmazService
        .tasinmazGuncelle(guncellenecekTasinmaz)
        .subscribe({
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

      this.tasinmazService
        .tasinmazEkle(formVerisi)
        .subscribe({
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