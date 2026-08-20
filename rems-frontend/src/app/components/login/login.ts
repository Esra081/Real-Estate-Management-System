import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth';

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
  hataMesaji = '';
  aktifSekme: 'login' | 'register' = 'login';
  registerAdSoyad = '';
  registerEmail = '';
  registerSifre = '';
  basariMesaji = '';
  yukleniyor = false;

  constructor(
    private authService: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onLogin() {
    this.hataMesaji = '';
    this.basariMesaji = '';
    this.yukleniyor = true;

    this.authService.login(this.email, this.sifre).subscribe({
      next: (response) => {
        this.yukleniyor = false;
        console.log('Giriş başarılı:', response);
        this.router.navigate(['/tasinmaz-liste']);
      },
      error: (err) => {
        this.yukleniyor = false;
        this.hataMesaji = err.error?.message || 'E-posta veya şifre hatalı!';
        console.error('Giriş hatası:', err);
        this.cdr.detectChanges();
      }
    });
  }

  sekmeDegistir(sekme: 'login' | 'register') {
    this.aktifSekme = sekme;
    this.hataMesaji = '';
    this.basariMesaji = '';
    this.cdr.detectChanges();
  }
  
  onRegister() {
    this.hataMesaji = '';
    this.basariMesaji = '';
    this.yukleniyor = true;
    this.cdr.detectChanges();

    this.authService.register(this.registerAdSoyad, this.registerEmail, this.registerSifre).subscribe({
      next: (res) => {
        this.yukleniyor = false;
        const mesaj = res.message || 'Hesabınız başarıyla oluşturuldu! Şimdi şifrenizi girerek giriş yapabilirsiniz.';
        this.basariMesaji = mesaj;
        this.email = this.registerEmail;
        this.sifre = '';
        this.registerAdSoyad = '';
        this.registerEmail = '';
        this.registerSifre = '';
        this.aktifSekme = 'login';
        this.cdr.detectChanges();
        alert(mesaj);
      },
      error: (err) => {
        this.yukleniyor = false;
        console.error('Kayıt Hatası Detayı:', err);

        let aciklama = 'Kayıt olurken bir hata oluştu.';

        if (err.error?.message) {
          aciklama = err.error.message;
        } else if (typeof err.error === 'string') {
          aciklama = err.error;
        } else if (err.error?.errors) {
          const keys = Object.keys(err.error.errors);
          aciklama = keys.map(k => err.error.errors[k].join(', ')).join(' | ');
        }

        this.hataMesaji = aciklama;
        this.cdr.detectChanges();
        alert('Kayıt Başarısız:\n\n' + aciklama);
      }
    });
  }
}