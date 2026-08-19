import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Kullanici } from '../models/kullanici.model';

@Injectable({ providedIn: 'root' })
export class KullaniciService {
  private apiUrl = `${environment.apiUrl}/Kullanici`;

  constructor(private http: HttpClient) {}

  getKullanicilar(): Observable<Kullanici[]> {
    return this.http.get<Kullanici[]>(this.apiUrl);
  }

  getKullaniciById(id: string): Observable<Kullanici> {
    return this.http.get<Kullanici>(`${this.apiUrl}/${id}`);
  }

  kullaniciEkle(data: { adSoyad: string; email: string; sifre: string; rol: string }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  kullaniciGuncelle(id: string, data: { id: string; adSoyad: string; email: string; rol: string; aktifMi: boolean; yeniSifre?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  kullaniciSil(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}