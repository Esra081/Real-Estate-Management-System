import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tasinmaz } from '../../models/tasinmaz.model';

@Injectable({
  providedIn: 'root'
})
export class TasinmazListeService {

  private apiUrl = 'https://localhost:7195/api/Tasinmaz';

  constructor(private http: HttpClient) {}

  getTasinmazlar(): Observable<Tasinmaz[]> {
    return this.http.get<Tasinmaz[]>(this.apiUrl);
  }

  tasinmazSil(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}