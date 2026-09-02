// 1. Haritada çizilen veya veritabanından gelen tek bir poligon
export interface PoligonDto {
  etiket: string; // "A", "B", "C", "D", "E"
  koordinatlar: number[][]; // [[lon, lat], [lon, lat], ...]
  alanM2?: number;
}

// 2. Kesişim veya Birleşim sonucu Backend'den dönen cevap paketi
export interface AlanAnalizSonucDto {
  basarili: boolean;
  mesaj: string;
  islemTipi: string; // "A ∩ B", "A ∪ B"
  sonucEtiketi?: string; // "D", "E" veya "Kesişim"
  alanM2: number;
  koordinatlar: number[][];
  cokluKoordinatlar?: number[][][]; 
}

// 3. Kesişim İsteği (Backend'e giden veri)
export interface KesisimIstekDto {
  p1: string; // "A"
  p2: string; // "B"
  geometriler?: PoligonDto[];
}

// 4. Birleşim İsteği (Backend'e giden veri)
export interface BirlesimIstekDto {
  etiketler: string[]; // ["A", "B"] veya ["A", "B", "C"]
  geometriler?: PoligonDto[];
}