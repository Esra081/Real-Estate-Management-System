export interface PoligonDto {
  etiket: string;
  koordinatlar: number[][];
  alanM2?: number;
}

export interface AlanAnalizSonucDto {
  basarili: boolean;
  mesaj: string;
  islemTipi: string;
  sonucEtiketi?: string;
  alanM2: number;
  koordinatlar: number[][];
  cokluKoordinatlar?: number[][][]; 
}

export interface KesisimIstekDto {
  p1: string;
  p2: string;
  geometriler?: PoligonDto[];
}

export interface BirlesimIstekDto {
  etiketler: string[];
  geometriler?: PoligonDto[];
}