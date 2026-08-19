import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { KullaniciService } from '../../services/kullanici.service';
import { Kullanici } from '../../models/kullanici.model';

@Component({
  selector: 'app-kullanici-liste',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './kullanici-liste.html',
  styleUrls: ['./kullanici-liste.scss']
})
export class KullaniciListeComponent implements OnInit {
  kullanicilar: Kullanici[] = [];
  yukleniyor = true;

  ekleForm!: FormGroup;
  guncelleForm!: FormGroup;
  secilenKullaniciId: string | null = null;
  kaydediliyor = false;

  constructor(
    private kullaniciService: KullaniciService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.formlariBaslat();
    this.veriGetir();
  }

  formlariBaslat(): void {
    this.ekleForm = this.fb.group({
      adSoyad: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      sifre: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(12)]],
      rol: ['Kullanici', Validators.required]
    });

    this.guncelleForm = this.fb.group({
      id: [''],
      adSoyad: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      rol: ['Kullanici', Validators.required],
      aktifMi: [true],
      yeniSifre: ['']
    });
  }

  veriGetir(): void {
    this.yukleniyor = true;
    this.kullaniciService.getKullanicilar().subscribe({
      next: (data) => {
        this.kullanicilar = data;
        this.yukleniyor = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Kullanıcılar alınırken hata oluştu:', err);
        this.yukleniyor = false;
        this.cdr.detectChanges();
      }
    });
  }

  get toplamKullanici(): number { return this.kullanicilar.length; }
  get adminSayisi(): number { return this.kullanicilar.filter(k => k.rol === 'Admin').length; }
  get standartKullaniciSayisi(): number { return this.kullanicilar.filter(k => k.rol === 'Kullanici').length; }
  get aktifKullaniciSayisi(): number { return this.kullanicilar.filter(k => k.aktifMi).length; }

  kullaniciEkle(): void {
    if (this.ekleForm.invalid) {
      alert('Lütfen tüm zorunlu alanları ve şifre kuralını (8-12 karakter, harf+sayı+özel karakter) doğru doldurun.');
      return;
    }

    this.kaydediliyor = true;
    this.kullaniciService.kullaniciEkle(this.ekleForm.value).subscribe({
      next: (res) => {
        alert(res.message || 'Kullanıcı başarıyla eklendi.');
        this.ekleForm.reset({ rol: 'Kullanici' });
        this.kaydediliyor = false;
        const modalKapat = document.getElementById('ekleModalKapatBtn');
        if (modalKapat) modalKapat.click();
        this.veriGetir();
      },
      error: (err) => {
        console.error('Ekleme hatası:', err);
        alert(err.error?.message || 'Kullanıcı eklenirken bir hata oluştu.');
        this.kaydediliyor = false;
      }
    });
  }

  duzenleAc(k: Kullanici): void {
    this.secilenKullaniciId = k.id;
    this.guncelleForm.patchValue({
      id: k.id,
      adSoyad: k.adSoyad,
      email: k.email,
      rol: k.rol,
      aktifMi: k.aktifMi,
      yeniSifre: ''
    });
  }

  kullaniciGuncelle(): void {
    if (this.guncelleForm.invalid) {
      alert('Lütfen geçerli bilgiler girin.');
      return;
    }

    this.kaydediliyor = true;
    const formVal = this.guncelleForm.value;
    this.kullaniciService.kullaniciGuncelle(formVal.id, formVal).subscribe({
      next: (res) => {
        alert(res.message || 'Kullanıcı başarıyla güncellendi.');
        this.kaydediliyor = false;
        const modalKapat = document.getElementById('guncelleModalKapatBtn');
        if (modalKapat) modalKapat.click();
        this.veriGetir();
      },
      error: (err) => {
        console.error('Güncelleme hatası:', err);
        alert(err.error?.message || 'Güncelleme sırasında bir hata oluştu.');
        this.kaydediliyor = false;
      }
    });
  }

  kullaniciSil(k: Kullanici): void {
    const onay = confirm(`"${k.adSoyad}" isimli kullanıcıyı silmek istediğinize emin misiniz?\n\nDİKKAT: Bu kullanıcıya ait tüm taşınmazlar da kalıcı olarak silinecektir!`);
    if (!onay) return;

    this.kullaniciService.kullaniciSil(k.id).subscribe({
      next: (res) => {
        alert(res.message || 'Kullanıcı ve taşınmazları silindi.');
        this.veriGetir();
      },
      error: (err) => {
        console.error('Silme hatası:', err);
        alert(err.error?.message || 'Silme işlemi sırasında hata oluştu.');
      }
    });
  }
}