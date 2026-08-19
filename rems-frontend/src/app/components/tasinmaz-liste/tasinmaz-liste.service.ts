import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Tasinmaz } from '../../models/tasinmaz.model';
import { PagedResponse } from '../../models/paged-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TasinmazListeService {

  private apiUrl = `${environment.apiUrl}/Tasinmaz`;

  constructor(
    private http: HttpClient
  ) {}

  getTasinmazlar(
    filtreler?: any
  ): Observable<PagedResponse<Tasinmaz>> {

    let params = new HttpParams();

    if (filtreler) {

      if (filtreler.ilId) {
        params = params.append(
          'ilId',
          filtreler.ilId
        );
      }

      if (filtreler.ilceId) {
        params = params.append(
          'ilceId',
          filtreler.ilceId
        );
      }

      if (filtreler.mahalleId) {
        params = params.append(
          'mahalleId',
          filtreler.mahalleId
        );
      }

      if (filtreler.adaNo) {
        params = params.append(
          'adaNo',
          filtreler.adaNo
        );
      }

      if (filtreler.parselNo) {
        params = params.append(
          'parselNo',
          filtreler.parselNo
        );
      }

      if (filtreler.adres) {
        params = params.append(
          'adres',
          filtreler.adres
        );
      }

      if (filtreler.tasinmazTipi) {
        params = params.append(
          'tasinmazTipi',
          filtreler.tasinmazTipi
        );
      }

      if (filtreler.pageNumber) {
        params = params.append(
          'pageNumber',
          filtreler.pageNumber
        );
      }

      if (filtreler.pageSize) {
        params = params.append(
          'pageSize',
          filtreler.pageSize
        );
      }
    }

    params = params.append('_t', new Date().getTime().toString());

    return this.http.get<PagedResponse<Tasinmaz>>(
      this.apiUrl,
      { params }
    );
  }

  tasinmazSil(
    id: number
  ): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/${id}`
    );
  }

  tasinmazlariSil(
    ids: number[]
  ): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/toplu-sil`,
      ids
    );
  }

  // EXCEL VE PDF DIŞA AKTARMA (API İSTEKLERİ)
  exportToExcel(filtreler?: any): Observable<Blob> {
    const params = this.filtreParametreleriniOlustur(filtreler);
    return this.http.get(`${this.apiUrl}/export/excel`, {
      params: params,
      responseType: 'blob'
    });
  }

  exportToPdf(filtreler?: any): Observable<Blob> {
    const params = this.filtreParametreleriniOlustur(filtreler);
    return this.http.get(`${this.apiUrl}/export/pdf`, {
      params: params,
      responseType: 'blob'
    });
  }

  private filtreParametreleriniOlustur(filtreler?: any): HttpParams {
    let params = new HttpParams();
    if (filtreler) {
      if (filtreler.ilId) params = params.append('ilId', filtreler.ilId);
      if (filtreler.ilceId) params = params.append('ilceId', filtreler.ilceId);
      if (filtreler.mahalleId) params = params.append('mahalleId', filtreler.mahalleId);
      if (filtreler.adaNo) params = params.append('adaNo', filtreler.adaNo);
      if (filtreler.parselNo) params = params.append('parselNo', filtreler.parselNo);
      if (filtreler.adres) params = params.append('adres', filtreler.adres);
      if (filtreler.tasinmazTipi) params = params.append('tasinmazTipi', filtreler.tasinmazTipi);
    }
    return params;
  }

  importFromExcel(dosya: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', dosya);
    return this.http.post(`${this.apiUrl}/import-excel`, formData);
  }

}