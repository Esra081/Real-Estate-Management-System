import { Component } from '@angular/core';
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

  constructor(private authService: Auth, private router: Router) {}

  onLogin() {
    this.authService.login(this.email, this.sifre).subscribe({
      next: (response) => {
        console.log('Giriş başarılı:', response);
        
        // Token auth.ts içinde zaten kaydedildi. Biz sadece yönlendiriyoruz:
        this.router.navigate(['/tasinmaz-liste']).then(success => {
            console.log("Yönlendirme durumu:", success);
        });
      },
      error: (err) => {
        this.hataMesaji = 'E-posta veya şifre hatalı!';
        console.error('Giriş hatası:', err);
      }
    });
  }
}