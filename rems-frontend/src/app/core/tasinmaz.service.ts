import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tasinmaz } from '../models/tasinmaz.model';

@Injectable({
  providedIn: 'root' // Bu servis tüm projede enjekte edilebilir demektir
})
export class TasinmazService {
  private apiUrl = 'https://localhost:7195/api/Tasinmaz'; 

  constructor(private http: HttpClient) {}

  // Backend'deki GetAll metoduna GET isteği atıyoruz
  getTasinmazlar(): Observable<Tasinmaz[]> {
    return this.http.get<Tasinmaz[]>(this.apiUrl);
  }
}