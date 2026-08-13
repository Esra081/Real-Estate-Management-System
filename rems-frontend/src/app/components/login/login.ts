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
        // Başarılı giriş sonrası şimdilik konsola yazdırıp liste sayfasına yönlendirebiliriz
        this.router.navigate(['/tasinmazlar']);
      },
      error: (err) => {
        this.hataMesaji = 'E-posta veya şifre hatalı!';
        console.error('Giriş hatası:', err);
      }
    });
  }
}