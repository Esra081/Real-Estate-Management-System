import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AktifKullanici {
  id: string;
  adSoyad: string;
  email: string;
  rol: string;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private baseUrl = `${environment.apiUrl}/Giris`;

  constructor(private http: HttpClient, private router: Router) {}

  // 1. Giriş Yapma (Login)
  login(email: string, sifre: string) {
    return this.http.post<{ token: string; message: string }>(
      `${this.baseUrl}/login`,
      { email, sifre }
    ).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
      })
    );
  }

  // 2. Çıkış Yapma (Logout)
  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  // 3. Kullanıcı Giriş Yapmış mı?
  get isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // 4. Token'ı çözüp giriş yapan kullanıcının bilgilerini dönen akıllı Getter
  get currentUser(): AktifKullanici | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = decodeURIComponent(
        atob(payloadBase64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(payloadJson);

      return {
        id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.nameid || decoded.sub || '',
        adSoyad: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded.unique_name || 'Kullanıcı',
        email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded.email || '',
        rol: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || 'Kullanici'
      };
    } catch (e) {
      console.error('Token çözümlenemedi:', e);
      return null;
    }
  }

  // 5. Giriş yapan kişi Admin mi?
  get isAdmin(): boolean {
    return this.currentUser?.rol === 'Admin';
  }
}