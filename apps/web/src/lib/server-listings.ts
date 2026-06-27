import type { ApiResponse, Listing, ListingSummary } from '@community-marketplace/types';

import { unwrapApiResponse } from '@/lib/normalize-api-response';

function getInternalApiBase(): string {
  const internal = process.env.INTERNAL_API_URL;
  if (internal) {
    return internal.endsWith('/api') ? internal : `${internal.replace(/\/$/, '')}/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
}

export function listingCacheTag(listingId: string): string {
  return `listing-${listingId}`;
}

export interface FetchListingOptions {
  /** When false, skips view-count increment (e.g. OG metadata). Default true. */
  trackView?: boolean;
}

export async function fetchListingById(
  listingId: string,
  options: FetchListingOptions = {},
): Promise<Listing | null> {
  const trackView = options.trackView !== false;
  try {
    const query = trackView ? '' : '?trackView=false';
    const response = await fetch(`${getInternalApiBase()}/listings/${listingId}${query}`, {
      next: { tags: [listingCacheTag(listingId)] },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return null;

    const json = (await response.json()) as ApiResponse<Listing>;
    return unwrapApiResponse(json).data ?? null;
  } catch {
    return null;
  }
}

export async function fetchSimilarListings(
  listingId: string,
  limit = 4,
): Promise<ListingSummary[]> {
  try {
    const response = await fetch(
      `${getInternalApiBase()}/listings/${listingId}/similar?limit=${limit}`,
      {
        next: { tags: [listingCacheTag(listingId), `listing-similar-${listingId}`] },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) return [];

    const json = (await response.json()) as ApiResponse<ListingSummary[]>;
    return unwrapApiResponse(json).data ?? [];
  } catch {
    return [];
  }
}
