import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Il } from '../models/il.model';
import { Ilce } from '../models/ilce.model';
import { Mahalle } from '../models/mahalle.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class LokasyonService {
    private apiUrl = `${environment.apiUrl}`;

    constructor(private http: HttpClient){}

    getIller(): Observable<Il[]> {
    return this.http.get<Il[]>(`${this.apiUrl}/il`);
    }

    getIlceler(ilId: number): Observable<Ilce[]> {
        return this.http.get<Ilce[]>(`${this.apiUrl}/Ilce/il/${ilId}`);
    }

    getMahalleler(ilceId: number): Observable<Mahalle[]> {
        return this.http.get<Mahalle[]>(`${this.apiUrl}/Mahalle/ilce/${ilceId}`);
    }
}

