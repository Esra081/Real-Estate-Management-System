export interface Tasinmaz {
  id: number;
  kullaniciId: string;
  kullaniciAdi?: string;
  ilAdi?: string;
  ilceAdi?: string;
  mahalleAdi?: string;
  mahalleId: number;
  adaNo: string;
  parselNo: string;
  adres: string;
  tasinmazTipi: string;
  alanM2: number;
  resimUrl?: string; 
  koordinatlar: number[][];
  secili?: boolean;
}