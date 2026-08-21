export interface Log {
  id: number;
  kullaniciId?: string;
  kullaniciEmail?: string;
  kullaniciAdi?: string;
  islemTipi: string;
  aciklama: string;
  durum: string; // 'Basarili' | 'Basarisiz'
  ipAdresi?: string;
  tarih: string;
}

export interface LogFiltre {
  kullaniciId?: string;
  islemTipi?: string;
  durum?: string;
  baslangicTarihi?: string;
  bitisTarihi?: string;
  aramaMetni?: string;
  pageNumber: number;
  pageSize: number;
}