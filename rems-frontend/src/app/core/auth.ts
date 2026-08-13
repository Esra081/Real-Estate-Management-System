import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Auth {
  // Backend'deki rota adın Giris olduğu için url'i buna göre düzenliyoruz
  private baseUrl = `${environment.apiUrl}/Giris`;

  constructor(private http: HttpClient) {}

  login(email: string, sifre: string) {
    return this.http.post<{ token: string; message: string }>(
      `${this.baseUrl}/login`,
      { email, sifre }
    ).pipe(
      tap(res => {
        localStorage.setItem('token', res.token); // Gelen JWT token'ı tarayıcıya kaydediyoruz
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
  }
}