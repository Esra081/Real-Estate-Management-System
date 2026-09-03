import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: number;
  tip: 'success' | 'error' | 'warning' | 'info';
  baslik: string;
  mesaj: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts$ = new BehaviorSubject<ToastMessage[]>([]);
  public toasts = this.toasts$.asObservable();
  private sayac = 0;

  success(mesaj: string, baslik: string = 'Başarılı'): void {
    this.ekle('success', baslik, mesaj);
  }

  error(mesaj: string, baslik: string = 'Hata'): void {
    this.ekle('error', baslik, mesaj);
  }

  info(mesaj: string, baslik: string = 'Bilgi'): void {
    this.ekle('info', baslik, mesaj);
  }

  warning(mesaj: string, baslik: string = 'Uyarı'): void {
    this.ekle('warning', baslik, mesaj);
  }

  private ekle(tip: 'success' | 'error' | 'warning' | 'info', baslik: string, mesaj: string): void {
    const id = ++this.sayac;
    const yeniToast: ToastMessage = { id, tip, baslik, mesaj };
    
    const mevcutListe = this.toasts$.getValue();
    this.toasts$.next([...mevcutListe, yeniToast]);

    setTimeout(() => {
      this.sil(id);
    }, 4000);
  }

  sil(id: number): void {
    const filtrelenmis = this.toasts$.getValue().filter(t => t.id !== id);
    this.toasts$.next(filtrelenmis);
  }
}