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
  /** Relative or absolute link to policy (e.g. prohibited items). */
  policyUrl?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
