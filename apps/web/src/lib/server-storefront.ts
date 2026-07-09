import type { ApiResponse, PaginatedResult, SellerStorefront, StorefrontListing } from '@community-marketplace/types';

import { normalizePaginated } from '@/lib/normalize-api-response';

function getInternalApiBase(): string {
  const internal = process.env.INTERNAL_API_URL;
  if (internal) {
    return internal.endsWith('/api') ? internal : `${internal.replace(/\/$/, '')}/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${getInternalApiBase()}${path}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchStoreBySlug(slug: string): Promise<SellerStorefront | null> {
  const json = await fetchJson<ApiResponse<SellerStorefront>>(`/stores/${encodeURIComponent(slug)}`);
  return json?.data ?? null;
}

export async function fetchStoreListings(
  slug: string,
  sort: 'newest' | 'price_low_to_high' | 'price_high_to_low' = 'newest',
  page = 1,
  limit = 24,
): Promise<PaginatedResult<StorefrontListing>> {
  const query = new URLSearchParams({
    sort,
    page: String(page),
    limit: String(limit),
  });
  const json = await fetchJson<ApiResponse<PaginatedResult<StorefrontListing> | StorefrontListing[]>>(
    `/stores/${encodeURIComponent(slug)}/listings?${query.toString()}`,
  );
  if (!json) return { data: [], meta: { page, limit, total: 0 } };
  return normalizePaginated(json, { page, limit });
}
