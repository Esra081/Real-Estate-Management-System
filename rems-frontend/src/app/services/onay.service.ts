import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface OnayData {
  baslik: string;
  mesaj: string;
  onayMetni?: string;
  iptalMetni?: string;
  tip?: 'danger' | 'warning' | 'primary';
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class OnayService {
  private modalState$ = new BehaviorSubject<OnayData | null>(null);
  public modal$ = this.modalState$.asObservable();

  sor(
    baslik: string,
    mesaj: string,
    onayMetni: string = 'Evet, Sil',
    iptalMetni: string = 'Vazgeç',
    tip: 'danger' | 'warning' | 'primary' = 'danger'
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.modalState$.next({
        baslik,
        mesaj,
        onayMetni,
        iptalMetni,
        tip,
        resolve
      });
    });
  }

  cevapla(karar: boolean): void {
    const mevcut = this.modalState$.getValue();
    if (mevcut) {
      mevcut.resolve(karar);
      this.modalState$.next(null);
    }
  }
}