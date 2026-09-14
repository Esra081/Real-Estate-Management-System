import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AktifKullanici {
  id: string;
  adSoyad: string;
  email: string;
  rol: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.apiUrl}/Giris`;

  private readonly currentUserSubject = new BehaviorSubject<AktifKullanici | null>(null);
  readonly currentUser$: Observable<AktifKullanici | null> = this.currentUserSubject.asObservable();

  private _currentUser: AktifKullanici | null = null;

  constructor(private http: HttpClient, private router: Router) {
    this.tokenYukleVeCoz();
  }

  /**
   * Sayfa yenilendiğinde sessionStorage'daki token'ı tek sefer çözümler ve hafızada saklar
   */
  private tokenYukleVeCoz(): void {
    const token = sessionStorage.getItem('token');
    if (token) {
      this._currentUser = this.tokenCoz(token);
      this.currentUserSubject.next(this._currentUser);
    } else {
      this._currentUser = null;
      this.currentUserSubject.next(null);
    }
  }

  login(email: string, sifre: string): Observable<{ token: string; message: string }> {
    return this.http.post<{ token: string; message: string }>(
      `${this.baseUrl}/login`,
      { email, sifre }
    ).pipe(
      tap(res => {
        sessionStorage.setItem('token', res.token);
        this._currentUser = this.tokenCoz(res.token);
        this.currentUserSubject.next(this._currentUser);
      })
    );
  }

  tokenYenile(): Observable<{ token: string; message: string }> {
    return this.http.post<{ token: string; message: string }>(
      `${this.baseUrl}/yenile`,
      {}
    ).pipe(
      tap(res => {
        sessionStorage.setItem('token', res.token);
        this._currentUser = this.tokenCoz(res.token);
        this.currentUserSubject.next(this._currentUser);
      })
    );
  }

  getTokenExp(): number | null {
    const token = sessionStorage.getItem('token');
    if (!token) return null;
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return null;
      const decoded = JSON.parse(atob(payloadBase64));
      return decoded.exp ? Number(decoded.exp) : null;
    } catch {
      return null;
    }
  }

  logout(neden: string = 'manual'): void {
    const token = sessionStorage.getItem('token');
    if (token) {
      this.http.post(`${this.baseUrl}/cikis?neden=${encodeURIComponent(neden)}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        error: () => {}
      });
    }

    sessionStorage.removeItem('token');
    this._currentUser = null;
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  get isLoggedIn(): boolean {
    return !!sessionStorage.getItem('token');
  }

  /**
   * Önceden çözümlenmiş kullanıcıyı döner, her getter çağrısında decode/parse yapmaz!
   */
  get currentUser(): AktifKullanici | null {
    if (!this._currentUser && this.isLoggedIn) {
      this.tokenYukleVeCoz();
    }
    return this._currentUser;
  }

  get isAdmin(): boolean {
    return this.currentUser?.rol === 'Admin';
  }

  register(adSoyad: string, email: string, sifre: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/register`,
      { adSoyad, email, sifre }
    );
  }

  /**
   * JWT payload'ını güvenli ve tek seferlik çözen yardımcı metot
   */
  private tokenCoz(token: string): AktifKullanici | null {
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return null;

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
}
