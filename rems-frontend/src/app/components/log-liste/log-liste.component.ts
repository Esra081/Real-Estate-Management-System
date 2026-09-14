import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LogService } from '../../services/log.service';
import { KullaniciService } from '../../services/kullanici.service';
import { Log, LogFiltre } from '../../models/log.model';
import { Kullanici } from '../../models/kullanici.model';
import { ToastService } from '../../shared/services/toast.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { downloadBlob } from '../../shared/helpers/file-download.helper';

@Component({
  selector: 'app-log-liste',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './log-liste.html',
  styleUrls: ['./log-liste.scss']
})
export class LogListeComponent implements OnInit {
  loglar: Log[] = [];
  yukleniyor = true;

  currentPage = 1;
  pageSize = 15;
  totalPages = 0;
  totalCount = 0;
  toplamBasariliSayisi = 0;
  toplamBasarisizSayisi = 0;

  filtreForm!: FormGroup;
  islemTipleri: string[] = [];
  kullanicilar: Kullanici[] = [];
  bugunTarihi: string = new Date().toISOString().split('T')[0];

  constructor(
    private logService: LogService,
    private kullaniciService: KullaniciService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private toast: ToastService
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
    this.logService.getIslemTipleri().subscribe({
      next: (tipler) => {
        this.islemTipleri = tipler || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('İşlem tipleri yüklenemedi:', err)
    });

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

    let baslangicIso: string | undefined = undefined;
    let bitisIso: string | undefined = undefined;

    // Başlangıç 00:00:00, Bitiş 23:59:59
    if (f.baslangicTarihi) {
      baslangicIso = `${f.baslangicTarihi}T00:00:00.000Z`;
      // Kullanıcı bitiş seçmediyse veya başlangıçla aynı gün seçildiyse  o günün gecesi 23:59'a kadar
      if (!f.bitisTarihi || f.baslangicTarihi === f.bitisTarihi) {
        bitisIso = `${f.baslangicTarihi}T23:59:59.999Z`;
      }
    }

    if (f.bitisTarihi && f.bitisTarihi !== f.baslangicTarihi) {
      bitisIso = `${f.bitisTarihi}T23:59:59.999Z`;
    }

    const filtreParam: LogFiltre = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      kullaniciId: f.kullaniciId || undefined,
      islemTipi: f.islemTipi || undefined,
      durum: f.durum || undefined,
      baslangicTarihi: baslangicIso,
      bitisTarihi: bitisIso,
      aramaMetni: f.aramaMetni || undefined
    };

    this.logService.getLogs(filtreParam).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.loglar = res.data || [];
          this.totalCount = res.totalCount || 0;
          this.totalPages = res.totalPages || 1;
          this.currentPage = res.currentPage || 1;
          this.toplamBasariliSayisi = res.basariliCount || 0;
          this.toplamBasarisizSayisi = res.basarisizCount || 0;
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
          this.yukleniyor = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  filtrele(): void {
    const f = this.filtreForm.value;
    // Başlangıç tarihi bitiş tarihinden sonra mı kontrolü:
    if (f.baslangicTarihi && f.bitisTarihi && new Date(f.baslangicTarihi) > new Date(f.bitisTarihi)) {
      this.toast.warning('Başlangıç tarihi bitiş tarihinden sonra olamaz!', 'Geçersiz Tarih');
      return; // Arama yapmasını engelliyoruz
    }
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
    if (yeniSayfa >= 1 && yeniSayfa <= this.totalPages && yeniSayfa !== this.currentPage) {
      this.currentPage = yeniSayfa;
      this.veriGetir();
    }
  }

  excelIndiriliyor = false;
  pdfIndiriliyor = false;

  excelIndir(): void {
    if (this.excelIndiriliyor) return;
    this.excelIndiriliyor = true;
    this.cdr.detectChanges();

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
        this.ngZone.run(() => {
          this.excelIndiriliyor = false;
          this.cdr.detectChanges();
        });
        downloadBlob(blob, `Sistem_Loglari_${new Date().getTime()}.xlsx`);
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          this.excelIndiriliyor = false;
          this.cdr.detectChanges();
        });
        console.error('Excel indirme hatası:', err);
        this.toast.error('Dışa aktarma başarısız oldu.');
      }
    });
  }

  pdfIndir(): void {
    if (this.pdfIndiriliyor) return;
    this.pdfIndiriliyor = true;
    this.cdr.detectChanges();

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
        this.ngZone.run(() => {
          this.pdfIndiriliyor = false;
          this.cdr.detectChanges();
        });
        downloadBlob(blob, `Sistem_Loglari_${new Date().getTime()}.pdf`);
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          this.pdfIndiriliyor = false;
          this.cdr.detectChanges();
        });
        console.error('PDF indirme hatası:', err);
        this.toast.error('Dışa aktarma başarısız oldu.');
      }
    });
  }

  get basariliSayisi(): number {
    return this.loglar.filter(l => l.durum === 'Basarili').length;
  }

  get basarisizSayisi(): number {
    return this.loglar.filter(l => l.durum === 'Basarisiz').length;
  }
}
