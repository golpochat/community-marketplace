export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
