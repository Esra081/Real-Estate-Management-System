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

  // 1. Manuel çizilen A, B, C poligonlarını backend'e gönderip kaydeder
  kaydetGeometriler(geometriler: PoligonDto[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/geometri`, geometriler);
  }

  // 2. Veritabanında kayıtlı A, B, C poligonlarını getirir (Auto-Select)
  getAutoSelectGeometriler(): Observable<PoligonDto[]> {
    return this.http.get<PoligonDto[]>(`${this.apiUrl}/auto-select`);
  }

  // 3. İki poligonun kesişimini hesaplar (POST /api/AlanAnalizi/kesisim)
  kesisimHesapla(istek: KesisimIstekDto): Observable<AlanAnalizSonucDto> {
    return this.http.post<AlanAnalizSonucDto>(`${this.apiUrl}/kesisim`, istek);
  }

  // 4. Poligonların birleşimini hesaplar ve DB'ye kaydeder (POST /api/AlanAnalizi/birlesim)
  birlesimHesapla(istek: BirlesimIstekDto): Observable<AlanAnalizSonucDto> {
    return this.http.post<AlanAnalizSonucDto>(`${this.apiUrl}/birlesim`, istek);
  }
}