export interface PagedResponse<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  totalAreaM2?: number;
  konutCount?: number;
  arsaCount?: number;
  binaCount?: number;
  topCitiesSummary?: string;
}