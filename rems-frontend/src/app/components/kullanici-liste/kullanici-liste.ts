import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { KullaniciService } from '../../services/kullanici.service';
import { Kullanici } from '../../models/kullanici.model';
import { OnayService } from '../../services/onay.service';
import { ToastService } from '../../services/toast.service';

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
  ekleModalAcik = false;
  guncelleModalAcik = false;

  constructor(
    private kullaniciService: KullaniciService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private onay: OnayService,
    private toast: ToastService
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
      this.toast.warning('Lütfen tüm zorunlu alanları ve şifre kuralını (8-12 karakter, harf+sayı+özel karakter) doğru doldurun.');
      return;
    }

    this.kaydediliyor = true;
    this.kullaniciService.kullaniciEkle(this.ekleForm.value).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Kullanıcı başarıyla eklendi.');
        this.kaydediliyor = false;
        this.modalKapat();
        this.veriGetir();
      },
      error: (err) => {
        console.error('Ekleme hatası:', err);
        this.toast.error(err.error?.message || 'Kullanıcı eklenirken bir hata oluştu.');
        this.kaydediliyor = false;
      }
    });
  }

  kullaniciGuncelle(): void {
    if (this.guncelleForm.invalid) {
      this.toast.warning('Lütfen geçerli bilgiler girin.');
      return;
    }

    this.kaydediliyor = true;
    const formVal = this.guncelleForm.value;
    this.kullaniciService.kullaniciGuncelle(formVal.id, formVal).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Kullanıcı başarıyla güncellendi.');
        this.kaydediliyor = false;
        this.modalKapat();
        this.veriGetir();
      },
      error: (err) => {
        console.error('Güncelleme hatası:', err);
        this.toast.error(err.error?.message || 'Güncelleme sırasında bir hata oluştu.');
        this.kaydediliyor = false;
      }
    });
  }

  async kullaniciSil(k: Kullanici): Promise<void> {
    const onay = await this.onay.sor(
      'Kullanıcıyı Sil',
      `"${k.adSoyad}" isimli kullanıcıyı silmek istediğinize emin misiniz? Bu kullanıcıya ait tüm taşınmaz kayıtları da kalıcı olarak silinecektir!`,
      'Evet, Kullanıcıyı Sil',
      'Vazgeç',
      'danger'
    );
    if (!onay) return;

    this.yukleniyor = true;
    this.cdr.detectChanges();

    this.kullaniciService.kullaniciSil(k.id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Kullanıcı ve taşınmazları silindi.');
        this.veriGetir();
      },
      error: (err) => {
        console.error('Silme hatası:', err);
        this.toast.error(err.error?.message || 'Silme işlemi sırasında hata oluştu.');
        this.yukleniyor = false;
        this.cdr.detectChanges();
      }
    });
  }

  ekleModalAc(): void {
    this.ekleForm.reset({ rol: 'Kullanici' });
    this.ekleModalAcik = true;
    this.cdr.detectChanges();
  }

  modalKapat(): void {
    this.ekleModalAcik = false;
    this.guncelleModalAcik = false;
    this.secilenKullaniciId = null;
    this.cdr.detectChanges();
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
    this.guncelleModalAcik = true;
    this.cdr.detectChanges();
  }
}