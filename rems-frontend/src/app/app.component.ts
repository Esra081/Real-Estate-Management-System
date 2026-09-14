import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/auth.service';
import { ToastService } from './shared/services/toast.service';
import { OnayService } from './shared/services/onay.service';
import { SessionTimeoutService } from './core/session-timeout.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent implements OnInit {
  title = 'rems-frontend';

  constructor(
    public auth: AuthService,
    public router: Router,
    public toastService: ToastService,
    public onayService: OnayService,
    public sessionTimeout: SessionTimeoutService
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(user => {
      if (user) {
        this.sessionTimeout.baslat();
      } else {
        this.sessionTimeout.durdur();
      }
    });

    if (this.auth.isLoggedIn) {
      this.sessionTimeout.baslat();
    }
  }

  get girisYapildi(): boolean {
    return this.auth.isLoggedIn;
  }

  get adminMi(): boolean {
    return this.auth.isAdmin;
  }

  get aktifKullaniciAdi(): string {
    return this.auth.currentUser?.adSoyad || '';
  }

  get aktifModulAdi(): string {
    const url = this.router.url;
    if (url.includes('alan-analizi')) return 'Mekansal Alan Analizi (GIS)';
    if (url.includes('kullanici')) return 'Kullanıcı Yönetim Paneli';
    if (url.includes('log')) return 'Sistem Denetim Logları';
    if (url.includes('tasinmaz-ekle') || url.includes('tasinmaz-duzenle')) return 'Taşınmaz Bilgi Formu';
    return 'Taşınmaz Yönetim Paneli';
  }

  cikisYap(): void {
    this.auth.logout();
  }
}
