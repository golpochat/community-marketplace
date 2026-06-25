import type { ApiResponse, ShortLinkResult } from '@community-marketplace/types';

import { unwrapApiResponse } from '@/lib/normalize-api-response';

function getInternalApiBase(): string {
  const internal = process.env.INTERNAL_API_URL;
  if (internal) {
    return internal.endsWith('/api') ? internal : `${internal.replace(/\/$/, '')}/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
}

export async function fetchShortLinkForListing(listingId: string): Promise<ShortLinkResult | null> {
  try {
    const response = await fetch(`${getInternalApiBase()}/share/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId }),
      signal: AbortSignal.timeout(10_000),
      next: { tags: [`listing-share-${listingId}`] },
    });
    if (!response.ok) return null;
    const json = (await response.json()) as ApiResponse<ShortLinkResult>;
    return unwrapApiResponse(json).data ?? null;
  } catch {
    return null;
  }
}

export async function resolveShortLink(shortCode: string): Promise<string | null> {
  try {
    const response = await fetch(`${getInternalApiBase()}/share/resolve/${shortCode}`, {
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const json = (await response.json()) as ApiResponse<{ listingId: string }>;
    return unwrapApiResponse(json).data?.listingId ?? null;
  } catch {
    return null;
  }
}
