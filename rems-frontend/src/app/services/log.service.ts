import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Log, LogFiltre } from '../models/log.model';

@Injectable({ providedIn: 'root' })
export class LogService {
  private apiUrl = `${environment.apiUrl}/Log`;

  constructor(private http: HttpClient) {}

  getLogs(filtre: LogFiltre): Observable<{ data: Log[]; totalCount: number; totalPages: number; currentPage: number }> {
    const params = this.filtreParametreleriniOlustur(filtre);
    return this.http.get<any>(this.apiUrl, { params });
  }

  getIslemTipleri(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/islem-tipleri`);
  }

  exportToExcel(filtre: Partial<LogFiltre>): Observable<Blob> {
    const params = this.filtreParametreleriniOlustur(filtre);
    return this.http.get(`${this.apiUrl}/export/excel`, {
      params: params,
      responseType: 'blob'
    });
  }

  exportToPdf(filtre: Partial<LogFiltre>): Observable<Blob> {
    const params = this.filtreParametreleriniOlustur(filtre);
    return this.http.get(`${this.apiUrl}/export/pdf`, {
      params: params,
      responseType: 'blob'
    });
  }

  private filtreParametreleriniOlustur(filtre: any): HttpParams {
    let params = new HttpParams();
    if (!filtre) return params;

    if (filtre.pageNumber) params = params.append('pageNumber', filtre.pageNumber.toString());
    if (filtre.pageSize) params = params.append('pageSize', filtre.pageSize.toString());
    if (filtre.kullaniciId) params = params.append('kullaniciId', filtre.kullaniciId);
    if (filtre.islemTipi) params = params.append('islemTipi', filtre.islemTipi);
    if (filtre.durum) params = params.append('durum', filtre.durum);
    if (filtre.baslangicTarihi) params = params.append('baslangicTarihi', filtre.baslangicTarihi);
    if (filtre.bitisTarihi) params = params.append('bitisTarihi', filtre.bitisTarihi);
    if (filtre.ipAdresi) params = params.append('ipAdresi', filtre.ipAdresi);
    if (filtre.aramaMetni) params = params.append('aramaMetni', filtre.aramaMetni);

    return params;
  }
}