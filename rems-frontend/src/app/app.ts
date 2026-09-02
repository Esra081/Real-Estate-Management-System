import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from './core/auth';
import { ToastService } from './services/toast.service';
import { OnayService } from './services/onay.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  title = 'rems-frontend';

  constructor(
    public auth: Auth,
    public router: Router,
    public toastService: ToastService,
    public onayService: OnayService
  ) {}

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