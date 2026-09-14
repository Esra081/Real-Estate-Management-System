import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { AuthService } from './auth.service';
import { ToastService } from '../shared/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService {
  // Uyarı penceresi: Son 5 dakika (300 saniye)
  private readonly UYARI_SURESI_SANIYE = 300;

  private timerSub: any = null;

  private readonly modalGorunurSubject = new BehaviorSubject<boolean>(false);
  readonly modalGorunur$ = this.modalGorunurSubject.asObservable();

  private readonly kalanSaniyeSubject = new BehaviorSubject<number>(300);
  readonly kalanSaniye$ = this.kalanSaniyeSubject.asObservable();

  private readonly islemYapiliyorSubject = new BehaviorSubject<boolean>(false);
  readonly islemYapiliyor$ = this.islemYapiliyorSubject.asObservable();

  // Kalan süreyi mm:ss formatına dönüştüren akış
  readonly formatliKalanSure$ = this.kalanSaniye$.pipe(
    map(saniye => {
      const s = Math.max(0, saniye);
      const dakika = Math.floor(s / 60);
      const kalanS = s % 60;
      return `${dakika.toString().padStart(2, '0')}:${kalanS.toString().padStart(2, '0')}`;
    })
  );

  constructor(
    private auth: AuthService,
    private toast: ToastService
  ) {}

  baslat(): void {
    this.durdur();
    if (!this.auth.isLoggedIn) return;

    this.timerSub = setInterval(() => {
      this.oturumKontrolEt();
    }, 1000);

    // İlk kontrolü hemen yap
    this.oturumKontrolEt();
  }

  durdur(): void {
    if (this.timerSub) {
      clearInterval(this.timerSub);
      this.timerSub = null;
    }
    this.modalGorunurSubject.next(false);
  }

  // Token süresini kontrol eder
  private oturumKontrolEt(): void {
    if (!this.auth.isLoggedIn) {
      this.durdur();
      return;
    }

    const expEpoch = this.auth.getTokenExp();
    if (!expEpoch) return;

    const simdikiZaman = Math.floor(Date.now() / 1000);
    const kalanSaniye = expEpoch - simdikiZaman;

    if (kalanSaniye <= 0) {
      // Süre tamamen doldu
      this.oturumuSonlandir('Oturum süreniz dolduğu için güvenli çıkış yapıldı.', 'timeout');
      return;
    }

    if (kalanSaniye <= this.UYARI_SURESI_SANIYE) {
      // Son 5 dakikaya girildi > Modalı aç ve saniyeyi güncelle
      this.kalanSaniyeSubject.next(kalanSaniye);
      if (!this.modalGorunurSubject.getValue()) {
        this.modalGorunurSubject.next(true);
      }
    } else {
      // Henüz 5 dakikadan fazla süre var > Modalı kapalı tut
      if (this.modalGorunurSubject.getValue()) {
        this.modalGorunurSubject.next(false);
      }
    }
  }

  // Kullanıcı "oturumu uzat butonuna bastığında çalışır
  oturumuUzat(): void {
    this.islemYapiliyorSubject.next(true);

    this.auth.tokenYenile().subscribe({
      next: () => {
        this.islemYapiliyorSubject.next(false);
        this.modalGorunurSubject.next(false);
        this.toast.success('Oturumunuz 1 saat süreyle uzatıldı.', 'Oturum Yenilendi');
      },
      error: () => {
        this.islemYapiliyorSubject.next(false);
        this.oturumuSonlandir('Oturum uzatılamadı, lütfen tekrar giriş yapın.', 'timeout');
      }
    });
  }

  // kullanıcı çıkış yapınca
  oturumuSonlandir(mesaj: string = 'Oturumunuz sonlandırıldı.', neden: string = 'manual'): void {
    this.durdur();
    this.auth.logout(neden);
    this.toast.warning(mesaj, 'Oturum Kapandı');
  }
}
