export interface PagedResponse<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}