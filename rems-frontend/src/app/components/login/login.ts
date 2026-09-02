import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  email = '';
  sifre = '';
  aktifSekme: 'login' | 'register' = 'login';
  registerAdSoyad = '';
  registerEmail = '';
  registerSifre = '';
  yukleniyor = false;

  constructor(
    private authService: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  onLogin() {
    this.yukleniyor = true;

    this.authService.login(this.email, this.sifre).subscribe({
      next: (response) => {
        this.yukleniyor = false;
        this.toast.success('Giriş başarılı! Yönlendiriliyorsunuz...');
        this.router.navigate(['/tasinmaz-liste']);
      },
      error: (err) => {
        this.yukleniyor = false;
        const hata = err.error?.message || 'E-posta veya şifre hatalı!';
        this.toast.error(hata, 'Giriş Başarısız');
        this.cdr.detectChanges();
      }
    });
  }

  sekmeDegistir(sekme: 'login' | 'register') {
    this.aktifSekme = sekme;
    this.cdr.detectChanges();
  }
  
  onRegister() {
    this.yukleniyor = true;
    this.cdr.detectChanges();

    this.authService.register(this.registerAdSoyad, this.registerEmail, this.registerSifre).subscribe({
      next: (res) => {
        this.yukleniyor = false;
        const mesaj = res.message || 'Hesabınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.';
        this.toast.success(mesaj, 'Kayıt Başarılı');
        this.email = this.registerEmail;
        this.sifre = '';
        this.registerAdSoyad = '';
        this.registerEmail = '';
        this.registerSifre = '';
        this.aktifSekme = 'login';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.yukleniyor = false;
        let aciklama = 'Kayıt olurken bir hata oluştu.';

        if (err.error?.message) {
          aciklama = err.error.message;
        } else if (typeof err.error === 'string') {
          aciklama = err.error;
        } else if (err.error?.errors) {
          const keys = Object.keys(err.error.errors);
          aciklama = keys.map(k => err.error.errors[k].join(', ')).join(' | ');
        }

        this.toast.error(aciklama, 'Kayıt Başarısız');
        this.cdr.detectChanges();
      }
    });
  }
}