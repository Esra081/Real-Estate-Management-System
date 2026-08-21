import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LogService } from '../../services/log.service';
import { KullaniciService } from '../../services/kullanici.service';
import { Log, LogFiltre } from '../../models/log.model';
import { Kullanici } from '../../models/kullanici.model';


@Component({
  selector: 'app-log-liste',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './log-liste.html',
  styleUrls: ['./log-liste.scss']
})
export class LogListeComponent implements OnInit {
  loglar: Log[] = [];
  yukleniyor = true;

  // Sayfalama
  currentPage = 1;
  pageSize = 15;
  totalPages = 0;
  totalCount = 0;
  sayfalamaDizisi: number[] = [];

  // Filtreler & Dropdown Verileri
  filtreForm!: FormGroup;
  islemTipleri: string[] = [];
  kullanicilar: Kullanici[] = [];

  constructor(
    private logService: LogService,
    private kullaniciService: KullaniciService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone 
  ) {}

  ngOnInit(): void {
    this.formOlustur();
    this.yardimciVerileriGetir();
    this.veriGetir();
  }

  formOlustur(): void {
    this.filtreForm = this.fb.group({
      kullaniciId: [''],
      islemTipi: [''],
      durum: [''],
      baslangicTarihi: [''],
      bitisTarihi: [''],
      aramaMetni: ['']
    });
  }

  yardimciVerileriGetir(): void {
    // İşlem tiplerini getir
    this.logService.getIslemTipleri().subscribe({
      next: (tipler) => {
        this.islemTipleri = tipler || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('İşlem tipleri yüklenemedi:', err)
    });

    // Filtre için kullanıcı listesini getir
    this.kullaniciService.getKullanicilar().subscribe({
      next: (users) => {
        this.kullanicilar = users || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Kullanıcılar yüklenemedi:', err)
    });
  }

  veriGetir(): void {
    this.yukleniyor = true;
    const f = this.filtreForm.value;

    const filtreParam: LogFiltre = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      kullaniciId: f.kullaniciId || undefined,
      islemTipi: f.islemTipi || undefined,
      durum: f.durum || undefined,
      baslangicTarihi: f.baslangicTarihi ? new Date(f.baslangicTarihi).toISOString() : undefined,
      bitisTarihi: f.bitisTarihi ? new Date(f.bitisTarihi).toISOString() : undefined,
      aramaMetni: f.aramaMetni || undefined
    };

    this.logService.getLogs(filtreParam).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.loglar = res.data || [];
          this.totalCount = res.totalCount || 0;
          this.totalPages = res.totalPages || 1;
          this.currentPage = res.currentPage || 1;
          this.sayfalamaDizisi = Array.from({ length: this.totalPages }, (_, i) => i + 1);
          this.yukleniyor = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          console.error('Loglar yüklenirken hata:', err);
          this.loglar = [];
          this.totalCount = 0;
          this.totalPages = 0;
          this.sayfalamaDizisi = [];
          this.yukleniyor = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  filtrele(): void {
    this.currentPage = 1;
    this.veriGetir();
  }

  filtreyiTemizle(): void {
    this.filtreForm.reset({
      kullaniciId: '',
      islemTipi: '',
      durum: '',
      baslangicTarihi: '',
      bitisTarihi: '',
      aramaMetni: ''
    });
    this.currentPage = 1;
    this.veriGetir();
  }

  sayfaDegistir(yeniSayfa: number): void {
    if (yeniSayfa >= 1 && yeniSayfa <= this.totalPages) {
      this.currentPage = yeniSayfa;
      this.veriGetir();
    }
  }

  excelIndir(): void {
    const f = this.filtreForm.value;
    const filtreParam: Partial<LogFiltre> = {
      kullaniciId: f.kullaniciId || undefined,
      islemTipi: f.islemTipi || undefined,
      durum: f.durum || undefined,
      baslangicTarihi: f.baslangicTarihi ? new Date(f.baslangicTarihi).toISOString() : undefined,
      bitisTarihi: f.bitisTarihi ? new Date(f.bitisTarihi).toISOString() : undefined,
      aramaMetni: f.aramaMetni || undefined
    };

    this.logService.exportToExcel(filtreParam).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Sistem_Loglari_${new Date().getTime()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('Excel indirme hatası:', err);
        alert('Excel dosyası indirilirken bir hata oluştu veya backend servisi henüz hazır değil.');
      }
    });
  }

  pdfIndir(): void {
    const f = this.filtreForm.value;
    const filtreParam: Partial<LogFiltre> = {
      kullaniciId: f.kullaniciId || undefined,
      islemTipi: f.islemTipi || undefined,
      durum: f.durum || undefined,
      baslangicTarihi: f.baslangicTarihi ? new Date(f.baslangicTarihi).toISOString() : undefined,
      bitisTarihi: f.bitisTarihi ? new Date(f.bitisTarihi).toISOString() : undefined,
      aramaMetni: f.aramaMetni || undefined
    };

    this.logService.exportToPdf(filtreParam).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Sistem_Loglari_${new Date().getTime()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('PDF indirme hatası:', err);
        alert('PDF dosyası indirilirken bir hata oluştu veya backend servisi henüz hazır değil.');
      }
    });
  }

  // İstatistik Sayaçları (Mevcut sayfadaki veya genel durum için)
  get basariliSayisi(): number {
    return this.loglar.filter(l => l.durum === 'Basarili').length;
  }

  get basarisizSayisi(): number {
    return this.loglar.filter(l => l.durum === 'Basarisiz').length;
  }
}
