export interface Kullanici {
  id: string;
  adSoyad: string;
  email: string;
  rol: string;
  olusturmaTarihi: string;
  aktifMi: boolean;
  tasinmazSayisi?: number;
}