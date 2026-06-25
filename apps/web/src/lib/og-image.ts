import { getAppUrl } from '@/lib/site-url';

/** Returns the edge-optimized OG image URL for a listing (1200×630 JPEG). */
export function getOptimizedOgImageUrl(listingId: string, _imageUrl?: string): string {
  return `${getAppUrl()}/api/og/listing/${listingId}`;
}
