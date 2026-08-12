import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tasinmaz } from '../models/tasinmaz.model';

@Injectable({
  providedIn: 'root'
})
export class TasinmazService {
  private apiUrl = 'https://localhost:5001/api/tasinmazlar';

  constructor(private http: HttpClient) { }

  getTasinmazlar(): Observable<Tasinmaz[]> {
    return this.http.get<Tasinmaz[]>(this.apiUrl);
  }

  addTasinmaz(tasinmaz: Tasinmaz): Observable<Tasinmaz> {
    return this.http.post<Tasinmaz>(this.apiUrl, tasinmaz);
  }
}