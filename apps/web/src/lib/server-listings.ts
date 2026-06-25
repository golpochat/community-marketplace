import type { ApiResponse, Listing } from '@community-marketplace/types';

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

export async function fetchListingById(listingId: string): Promise<Listing | null> {
  try {
    const response = await fetch(`${getInternalApiBase()}/listings/${listingId}`, {
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
