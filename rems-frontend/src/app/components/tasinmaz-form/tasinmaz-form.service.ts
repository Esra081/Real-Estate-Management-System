import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tasinmaz } from '../../models/tasinmaz.model';

@Injectable({
  providedIn: 'root'
})
export class TasinmazFormService {
  private apiUrl = `${environment.apiUrl}/tasinmaz`;

  constructor(private http: HttpClient) {}

  getTasinmazById(id: number): Observable<Tasinmaz> {
    return this.http.get<Tasinmaz>(`${this.apiUrl}/${id}`);
  }

  tasinmazEkle(tasinmaz: Tasinmaz): Observable<{ message: string; id?: number }> {
    return this.http.post<{ message: string; id?: number }>(this.apiUrl, tasinmaz);
  }

  tasinmazGuncelle(tasinmaz: Tasinmaz): Observable<{ message: string; hasChanges?: boolean }> {
    return this.http.put<{ message: string; hasChanges?: boolean }>(`${this.apiUrl}/${tasinmaz.id}`, tasinmaz);
  }

  resimYukle(id: number, dosya: File): Observable<{ message: string; resimUrl?: string }> {
    const formData = new FormData();
    formData.append('file', dosya);
    return this.http.post<{ message: string; resimUrl?: string }>(`${this.apiUrl}/${id}/resim-yukle`, formData);
  }

  getResimUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}
