import type { ApiResponse, PaginatedResult, PaginationMeta } from '@community-marketplace/types';

/**
 * The API transform interceptor wraps service payloads as `{ data: payload }`.
 * Paginated services return `{ data: T[], meta }`, so clients receive
 * `{ data: { data: T[], meta } }`. This helper flattens that shape.
 */
export function unwrapApiResponse<T>(json: ApiResponse<T>): ApiResponse<T> {
  let data: unknown = json.data;
  let meta: PaginationMeta | undefined = json.meta;

  while (isPaginatedList(data)) {
    const inner = data;
    data = inner.data;
    meta = inner.meta ?? meta;
  }

  return { data: data as T, meta };
}

function isPaginatedList(
  value: unknown,
): value is PaginatedResult<unknown> {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'data' in value &&
    'meta' in value &&
    Array.isArray((value as PaginatedResult<unknown>).data)
  );
}

export function normalizePaginated<T>(
  response: ApiResponse<T[] | PaginatedResult<T>>,
  fallback: { page: number; limit: number },
): PaginatedResult<T> {
  const unwrapped = unwrapApiResponse(response as ApiResponse<T[] | PaginatedResult<T>>);
  const payload = unwrapped.data;

  if (Array.isArray(payload)) {
    return {
      data: payload,
      meta: unwrapped.meta ?? {
        page: fallback.page,
        limit: fallback.limit,
        total: payload.length,
      },
    };
  }

  if (isPaginatedList(payload)) {
    return {
      data: payload.data as T[],
      meta: payload.meta ?? unwrapped.meta ?? {
        page: fallback.page,
        limit: fallback.limit,
        total: payload.data.length,
      },
    };
  }

  return { data: [], meta: { page: fallback.page, limit: fallback.limit, total: 0 } };
}

export function getUnreadCount(meta: PaginationMeta | undefined): number {
  return (meta as PaginationMeta & { unreadCount?: number } | undefined)?.unreadCount ?? 0;
}

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}
