import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';

import { TasinmazListeService } from './tasinmaz-liste.service';
import { TasinmazMapService } from './tasinmaz-map.service';
import { Tasinmaz } from '../../models/tasinmaz.model';
import { Il } from '../../models/il.model';
import { Ilce } from '../../models/ilce.model';
import { Mahalle } from '../../models/mahalle.model';
import { Kullanici } from '../../models/kullanici.model';
import { LokasyonService } from '../../services/lokasyon.service';
import { KullaniciService } from '../../services/kullanici.service';
import { AuthService } from '../../core/auth.service';
import { OnayService } from '../../shared/services/onay.service';
import { ToastService } from '../../shared/services/toast.service';
import { MAP_ICONS } from '../../shared/constants/map-icons';
import { KesisimBilgi } from '../../shared/helpers/gis-spatial.helper';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { downloadBlob } from '../../shared/helpers/file-download.helper';

@Component({
  selector: 'app-tasinmaz-liste',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PaginationComponent
  ],
  providers: [TasinmazMapService],
  templateUrl: './tasinmaz-liste.html',
  styleUrls: ['./tasinmaz-liste.scss']
})
export class TasinmazListeComponent implements OnInit, AfterViewInit, OnDestroy {
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
  tumKullanicilar: Kullanici[] = [];
  seciliIdler = new Set<number>();
  tumSecili = false;

  // Harita & Kesişim Durumları
  secilenTasinmaz: Tasinmaz | null = null;
  secilenKesisim: KesisimBilgi | null = null;
  kesisimSayisi: number = 0;
  kumedekiTasinmazlar: Tasinmaz[] = [];
  aktifAltlik: 'standart' | 'uydu' = 'standart';
  altlikOpaklik: number = 100;
  tasinmazOpaklik: number = 80;

  // Harita İkonları
  readonly pinSvgKonut = MAP_ICONS.konut;
  readonly pinSvgArsa = MAP_ICONS.arsa;
  readonly pinSvgBina = MAP_ICONS.bina;

  // Excel
  secilenExcelDosyasi: File | null = null;
  importYukleniyor = false;
  excelModalAcik = false;
  importHataMesaji: string | null = null;
  private importSubscription?: Subscription;
  private mapSubscriptions = new Subscription();

  // Genel İstatistikler
  genelToplamAlan: number = 0;
  genelKonutSayisi: number = 0;
  genelArsaSayisi: number = 0;
  genelBinaSayisi: number = 0;
  genelEnCokIller: string = 'Kayıt Yok';

  constructor(
    private tasinmazService: TasinmazListeService,
    private mapService: TasinmazMapService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private lokasyonService: LokasyonService,
    private kullaniciService: KullaniciService,
    public auth: AuthService,
    private onay: OnayService,
    private toast: ToastService
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
      kullaniciId: ['']
    });

    this.illeriGetir();

    if (this.auth.isAdmin) {
      this.kullaniciService.getKullanicilar().subscribe({
        next: (users) => {
          this.tumKullanicilar = users || [];
          this.cdr.detectChanges();
        }
      });
    }

    this.activatedRoute.queryParams.subscribe((params) => {
      this.currentPage = Number(params['page']) || 1;

      this.filtreForm.patchValue({
        ilId: params['ilId'] || '',
        ilceId: params['ilceId'] || '',
        mahalleId: params['mahalleId'] || '',
        adaNo: params['adaNo'] || '',
        parselNo: params['parselNo'] || '',
        adres: params['adres'] || '',
        tasinmazTipi: params['tasinmazTipi'] || '',
        kullaniciId: params['kullaniciId'] || ''
      }, { emitEvent: false });

      if (params['ilId']) {
        this.lokasyonService.getIlceler(Number(params['ilId'])).subscribe((data) => {
          this.ilceler = data || [];
          this.cdr.detectChanges();
        });
      }

      if (params['ilceId']) {
        this.lokasyonService.getMahalleler(Number(params['ilceId'])).subscribe((data) => {
          this.mahalleler = data || [];
          this.cdr.detectChanges();
        });
      }

      this.veriGetir();
    });
  }

  ngAfterViewInit(): void {
    const popupElement = document.getElementById('popup');
    this.mapService.haritayiBaslat('map', popupElement);

    // Harita servisinden gelen kullanıcı etkileşimlerini dinle
    this.mapSubscriptions.add(
      this.mapService.secilenTasinmaz$.subscribe((tasinmaz) => {
        this.secilenTasinmaz = tasinmaz;
        this.cdr.detectChanges();
      })
    );

    this.mapSubscriptions.add(
      this.mapService.secilenKesisim$.subscribe((kesisim) => {
        this.secilenKesisim = kesisim;
        this.cdr.detectChanges();
      })
    );

    this.mapSubscriptions.add(
      this.mapService.kumedekiTasinmazlar$.subscribe((list) => {
        this.kumedekiTasinmazlar = list;
        this.cdr.detectChanges();
      })
    );

    this.mapSubscriptions.add(
      this.mapService.kesisimSayisi$.subscribe((sayi) => {
        this.kesisimSayisi = sayi;
        this.cdr.detectChanges();
      })
    );

    if (this.tasinmazlar.length > 0) {
      this.mapService.tasinmazlariCiz(this.tasinmazlar);
    }
  }

  ngOnDestroy(): void {
    if (this.altlikRaf) cancelAnimationFrame(this.altlikRaf);
    if (this.tasinmazRaf) cancelAnimationFrame(this.tasinmazRaf);
    if (this.importSubscription) {
      this.importSubscription.unsubscribe();
    }
    this.mapSubscriptions.unsubscribe();
    this.mapService.destroy();
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
      ilId: ilId,
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

  // Harita Etkileşim Metotları
  popupKapat(): void {
    this.mapService.popupKapat();
  }

  kumedekiTasinmaziSec(t: Tasinmaz): void {
    this.mapService.kumedekiTasinmaziSec(t);
  }

  altlikDegistir(tip: 'standart' | 'uydu'): void {
    this.aktifAltlik = tip;
    this.mapService.altlikDegistir(tip);
    this.cdr.detectChanges();
  }

  private altlikRaf?: number;
  private tasinmazRaf?: number;

  altlikOpaklikDegistir(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.altlikOpaklik = Number(target.value);
    if (this.altlikRaf) cancelAnimationFrame(this.altlikRaf);
    this.altlikRaf = requestAnimationFrame(() => {
      this.mapService.setAltlikOpaklik(this.altlikOpaklik);
    });
  }

  tasinmazOpaklikDegistir(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.tasinmazOpaklik = Number(target.value);
    if (this.tasinmazRaf) cancelAnimationFrame(this.tasinmazRaf);
    this.tasinmazRaf = requestAnimationFrame(() => {
      this.mapService.setTasinmazOpaklik(this.tasinmazOpaklik);
    });
  }

  haritadaTasinmazaGit(tasinmaz: Tasinmaz): void {
    this.mapService.tasinmazaOdaklan(tasinmaz);
  }

  haritadaGoster(item: Tasinmaz): void {
    this.mapService.tasinmazaOdaklan(item);
  }

  // Veri Çekme & Filtreleme
  veriGetir(): void {
    this.yukleniyor = true;
    const gidenFiltreler = {
      ...this.aktifFiltreleriAl(),
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };

    this.tasinmazService.getTasinmazlar(gidenFiltreler).subscribe({
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

        this.tasinmazlar.forEach(t => {
          t.secili = this.seciliIdler.has(t.id);
        });
        this.tumSecili = this.tasinmazlar.length > 0 && this.tasinmazlar.every(t => t.secili);
        this.yukleniyor = false;
        this.mapService.tasinmazlariCiz(this.tasinmazlar);
        this.cdr.detectChanges();
      },
      error: (hata) => {
        console.error('Veriler getirilirken hata oluştu:', hata);
        this.tasinmazlar = [];
        this.tumSecili = false;
        this.yukleniyor = false;
        this.mapService.tasinmazlariCiz(this.tasinmazlar);
        this.cdr.detectChanges();
      }
    });
  }

  sayfaDegistir(yeniSayfa: number): void {
    if (yeniSayfa >= 1 && yeniSayfa <= this.totalPages && yeniSayfa !== this.currentPage) {
      this.currentPage = yeniSayfa;
      this.urlGuncelle();
    }
  }

  filtrele(): void {
    this.currentPage = 1;
    this.urlGuncelle();
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
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {}
    });
  }

  private urlGuncelle(): void {
    const val = this.filtreForm.value;
    const qParams: any = {};

    if (this.currentPage > 1) qParams.page = this.currentPage;
    if (val.ilId) qParams.ilId = val.ilId;
    if (val.ilceId) qParams.ilceId = val.ilceId;
    if (val.mahalleId) qParams.mahalleId = val.mahalleId;
    if (val.tasinmazTipi) qParams.tasinmazTipi = val.tasinmazTipi;
    if (val.adaNo && val.adaNo.trim()) qParams.adaNo = val.adaNo.trim();
    if (val.parselNo && val.parselNo.trim()) qParams.parselNo = val.parselNo.trim();
    if (val.adres && val.adres.trim()) qParams.adres = val.adres.trim();
    if (val.kullaniciId) qParams.kullaniciId = val.kullaniciId;

    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: qParams
    });
  }

  // CRUD İşlemleri
  async secilenleriSil(): Promise<void> {
    const secilenIdler = Array.from(this.seciliIdler);
    if (secilenIdler.length === 0) return;

    const onay = await this.onay.sor(
      'Toplu Taşınmaz Silme',
      `Seçilen ${secilenIdler.length} adet taşınmazı ve haritadaki sınırlarını kalıcı olarak silmek istediğinize emin misiniz?`,
      'Evet, Hepsini Sil',
      'Vazgeç'
    );
    if (!onay) return;

    this.yukleniyor = true;
    this.cdr.detectChanges();
    this.tasinmazService.tasinmazlariSil(secilenIdler).subscribe({
      next: () => {
        this.toast.success(`${secilenIdler.length} adet taşınmaz başarıyla silindi.`);
        this.seciliIdler.clear();
        this.tumSecili = false;
        this.veriGetir();
      },
      error: (hata) => {
        console.error('Taşınmazlar silinirken hata oluştu:', hata);
        this.toast.error('Taşınmazlar silinirken bir hata oluştu.');
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

  async sil(id: number): Promise<void> {
    const onay = await this.onay.sor(
      'Taşınmazı Sil',
      'Bu taşınmaz kaydı ve haritadaki sınırları kalıcı olarak silinecektir. Onaylıyor musunuz?',
      'Evet, Sil',
      'Vazgeç'
    );
    if (!onay) return;

    this.yukleniyor = true;
    this.cdr.detectChanges();
    this.tasinmazService.tasinmazSil(id).subscribe({
      next: () => {
        this.toast.success('Taşınmaz kaydı başarıyla silindi.');
        this.seciliIdler.delete(id);
        this.tumSecili = this.tasinmazlar.length > 0 && this.tasinmazlar.every(t => this.seciliIdler.has(t.id));
        this.veriGetir();
      },
      error: (hata) => {
        console.error('Taşınmaz silinirken hata oluştu:', hata);
        this.toast.error('Taşınmaz silinirken bir hata oluştu.');
        this.yukleniyor = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Raporlama & Dışa/İçe Aktarma
  private aktifFiltreleriAl(): any {
    const formFiltreleri = this.filtreForm.value;
    const filtreler: any = {};

    if (formFiltreleri.ilId && formFiltreleri.ilId !== '' && formFiltreleri.ilId !== 'null') filtreler.ilId = formFiltreleri.ilId;
    if (formFiltreleri.ilceId && formFiltreleri.ilceId !== '' && formFiltreleri.ilceId !== 'null') filtreler.ilceId = formFiltreleri.ilceId;
    if (formFiltreleri.mahalleId && formFiltreleri.mahalleId !== '' && formFiltreleri.mahalleId !== 'null') filtreler.mahalleId = formFiltreleri.mahalleId;
    let adaDegeri = (formFiltreleri.adaNo || '').trim();
    let parselDegeri = (formFiltreleri.parselNo || '').trim();

    if (adaDegeri.includes('/') || adaDegeri.includes('-')) {
      const parcalar = adaDegeri.split(/[\/\-]/);
      adaDegeri = parcalar[0]?.trim() || '';
      parselDegeri = parcalar[1]?.trim() || '';
    }

    if (adaDegeri !== '') filtreler.adaNo = adaDegeri;
    if (parselDegeri !== '') filtreler.parselNo = parselDegeri;
    if (formFiltreleri.adres && formFiltreleri.adres.trim() !== '') filtreler.adres = formFiltreleri.adres.trim();
    if (formFiltreleri.tasinmazTipi && formFiltreleri.tasinmazTipi !== '') filtreler.tasinmazTipi = formFiltreleri.tasinmazTipi;

    if (!this.auth.isAdmin && this.auth.currentUser) {
      filtreler.kullaniciId = this.auth.currentUser.id;
    } else if (formFiltreleri.kullaniciId && formFiltreleri.kullaniciId !== '') {
      filtreler.kullaniciId = formFiltreleri.kullaniciId;
    }

    return filtreler;
  }

  excelIndir(): void {
    const filtreler = this.aktifFiltreleriAl();
    this.tasinmazService.exportToExcel(filtreler).subscribe({
      next: (blob: Blob) => {
        downloadBlob(blob, `Tasinmazlar_${new Date().getTime()}.xlsx`);
        this.toast.success('Excel raporu başarıyla indirildi.');
      },
      error: (err) => {
        console.error('Excel indirilirken hata oluştu:', err);
        this.toast.error('Excel dosyası indirilirken bir hata oluştu.');
      }
    });
  }

  pdfIndir(): void {
    const filtreler = this.aktifFiltreleriAl();
    this.tasinmazService.exportToPdf(filtreler).subscribe({
      next: (blob: Blob) => {
        downloadBlob(blob, `Tasinmazlar_${new Date().getTime()}.pdf`);
        this.toast.success('PDF raporu başarıyla indirildi.');
      },
      error: (err) => {
        console.error('PDF indirilirken hata oluştu:', err);
        this.toast.error('PDF dosyası indirilirken bir hata oluştu.');
      }
    });
  }

  excelModalAc(): void {
    this.excelModalAcik = true;
    this.secilenExcelDosyasi = null;
    this.importYukleniyor = false;
    this.importHataMesaji = null;
    this.cdr.detectChanges();
  }

  excelModalKapat(): void {
    if (this.importSubscription) {
      this.importSubscription.unsubscribe();
      this.importSubscription = undefined;
    }
    this.excelModalAcik = false;
    this.secilenExcelDosyasi = null;
    this.importYukleniyor = false;
    this.importHataMesaji = null;
    this.cdr.detectChanges();
  }

  excelDosyaSecildi(event: any): void {
    this.importHataMesaji = null;
    const dosya = event.target?.files?.[0];
    if (dosya) {
      if (!dosya.name.toLowerCase().endsWith('.xlsx')) {
        this.toast.warning('Lütfen sadece .xlsx uzantılı Excel dosyası seçin!');
        event.target.value = '';
        this.secilenExcelDosyasi = null;
        this.cdr.detectChanges();
        return;
      }
      this.secilenExcelDosyasi = dosya;
      this.cdr.detectChanges();
    } else {
      this.secilenExcelDosyasi = null;
      this.cdr.detectChanges();
    }
  }

  excelIceAktar(): void {
    if (!this.secilenExcelDosyasi) {
      this.toast.warning('Lütfen önce bir Excel dosyası seçin.');
      return;
    }
    this.importYukleniyor = true;
    this.importHataMesaji = null;
    this.cdr.detectChanges();

    this.importSubscription = this.tasinmazService.importFromExcel(this.secilenExcelDosyasi).subscribe({
      next: (res: any) => {
        this.toast.success(res.message || 'Taşınmazlar başarıyla içe aktarıldı!');
        this.secilenExcelDosyasi = null;
        this.importYukleniyor = false;
        this.importHataMesaji = null;
        this.excelModalAcik = false;
        this.veriGetir();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('İçe aktarma hatası:', err);
        const mesaj = err.error?.message || err.message || 'İçe aktarma başarısız oldu.';
        this.toast.error(mesaj);
        this.importHataMesaji = mesaj;
        this.importYukleniyor = false;
        this.cdr.detectChanges();
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

  getResimUrl(url?: string): string {
    return this.tasinmazService.getResimUrl(url);
  }
}