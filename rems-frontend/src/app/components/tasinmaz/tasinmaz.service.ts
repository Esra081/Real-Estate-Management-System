import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tasinmaz } from '../../models/tasinmaz.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TasinmazService {

  private apiUrl = `${environment.apiUrl}/Tasinmaz`;

  constructor(private http: HttpClient) {}

  getTasinmazById(id: number): Observable<Tasinmaz> {
    return this.http.get<Tasinmaz>(`${this.apiUrl}/${id}`);
  }

  tasinmazEkle(tasinmaz: Tasinmaz): Observable<any> {
    return this.http.post(`${this.apiUrl}/ekle`, tasinmaz);
  }

  tasinmazGuncelle(tasinmaz: Tasinmaz): Observable<any> {
    return this.http.put(`${this.apiUrl}/${tasinmaz.id}`, tasinmaz);
  }

  tasinmazSil(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}