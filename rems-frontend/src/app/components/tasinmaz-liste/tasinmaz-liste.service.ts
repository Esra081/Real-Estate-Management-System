import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tasinmaz, TasinmazFiltre } from '../../models/tasinmaz.model';
import { PagedResponse } from '../../models/paged-response.model';

@Injectable({
  providedIn: 'root'
})
export class TasinmazListeService {
  private apiUrl = `${environment.apiUrl}/tasinmaz`;

  constructor(private http: HttpClient) {}

  getTasinmazlar(filtreler?: Partial<TasinmazFiltre>): Observable<PagedResponse<Tasinmaz>> {
    const params = this.filtreParametreleriniOlustur(filtreler);
    return this.http.get<PagedResponse<Tasinmaz>>(this.apiUrl, { params });
  }

  tasinmazSil(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  tasinmazlariSil(ids: number[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/toplu-sil`, ids);
  }

  importFromExcel(dosya: File): Observable<{ message: string; count?: number }> {
    const formData = new FormData();
    formData.append('file', dosya);
    return this.http.post<{ message: string; count?: number }>(`${this.apiUrl}/import-excel`, formData);
  }

  exportToExcel(filtreler?: Partial<TasinmazFiltre>): Observable<Blob> {
    const params = this.filtreParametreleriniOlustur(filtreler);
    return this.http.get(`${this.apiUrl}/export/excel`, {
      params: params,
      responseType: 'blob'
    });
  }

  exportToPdf(filtreler?: Partial<TasinmazFiltre>): Observable<Blob> {
    const params = this.filtreParametreleriniOlustur(filtreler);
    return this.http.get(`${this.apiUrl}/export/pdf`, {
      params: params,
      responseType: 'blob'
    });
  }

  getResimUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  private filtreParametreleriniOlustur(filtreler?: Partial<TasinmazFiltre>): HttpParams {
    let params = new HttpParams();
    if (filtreler) {
      if (filtreler.ilId) params = params.append('ilId', filtreler.ilId.toString());
      if (filtreler.ilceId) params = params.append('ilceId', filtreler.ilceId.toString());
      if (filtreler.mahalleId) params = params.append('mahalleId', filtreler.mahalleId.toString());
      if (filtreler.adaNo) params = params.append('adaNo', filtreler.adaNo);
      if (filtreler.parselNo) params = params.append('parselNo', filtreler.parselNo);
      if (filtreler.adres) params = params.append('adres', filtreler.adres);
      if (filtreler.tasinmazTipi) params = params.append('tasinmazTipi', filtreler.tasinmazTipi);
      if (filtreler.kullaniciId) params = params.append('kullaniciId', filtreler.kullaniciId);
      if (filtreler.pageNumber) params = params.append('pageNumber', filtreler.pageNumber.toString());
      if (filtreler.pageSize) params = params.append('pageSize', filtreler.pageSize.toString());
    }
    return params;
  }
}
