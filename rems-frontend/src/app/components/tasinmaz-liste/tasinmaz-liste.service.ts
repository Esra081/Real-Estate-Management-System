import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tasinmaz } from '../../models/tasinmaz.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TasinmazListeService {

  private apiUrl = `${environment.apiUrl}/Tasinmaz`;

  constructor(private http: HttpClient) {}

  getTasinmazlar(): Observable<Tasinmaz[]> {
    return this.http.get<Tasinmaz[]>(this.apiUrl);
  }

  tasinmazSil(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}