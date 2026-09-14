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

export interface TasinmazFiltre {
  ilId?: number | string;
  ilceId?: number | string;
  mahalleId?: number | string;
  adaNo?: string;
  parselNo?: string;
  adres?: string;
  tasinmazTipi?: string;
  kullaniciId?: string;
  pageNumber?: number;
  pageSize?: number;
}