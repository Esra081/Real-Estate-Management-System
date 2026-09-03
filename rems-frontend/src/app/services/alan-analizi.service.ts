import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  PoligonDto,
  AlanAnalizSonucDto,
  KesisimIstekDto,
  BirlesimIstekDto
} from '../models/alan-analizi.model';

@Injectable({ providedIn: 'root' })
export class AlanAnaliziService {
  private apiUrl = `${environment.apiUrl}/AlanAnalizi`;

  constructor(private http: HttpClient) {}

  kaydetGeometriler(geometriler: PoligonDto[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/geometri`, geometriler);
  }

  getAutoSelectGeometriler(): Observable<PoligonDto[]> {
    return this.http.get<PoligonDto[]>(`${this.apiUrl}/auto-select`);
  }

  kesisimHesapla(istek: KesisimIstekDto): Observable<AlanAnalizSonucDto> {
    return this.http.post<AlanAnalizSonucDto>(`${this.apiUrl}/kesisim`, istek);
  }

  birlesimHesapla(istek: BirlesimIstekDto): Observable<AlanAnalizSonucDto> {
    return this.http.post<AlanAnalizSonucDto>(`${this.apiUrl}/birlesim`, istek);
  }
}