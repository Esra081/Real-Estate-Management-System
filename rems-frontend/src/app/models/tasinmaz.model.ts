export interface Tasinmaz {
  id: string;
  kullaniciId: string;
  mahalleId: number;
  adaNo: string;
  parselNo: string;
  adres: string;
  tasinmazTipi: string; // 'Arsa' / 'Bina' / 'Konut'
  alanM2?: number;
  olusturmaTarihi?: Date;
}