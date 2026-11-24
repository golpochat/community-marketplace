import {
  extractListingCompactId,
  isBareListingId,
  parseListingRouteParam,
} from '@community-marketplace/utils';

export type ParsedListingPayRef =
  | { kind: 'uuid'; id: string }
  | { kind: 'compact'; compactId: string };

/**
 * Parse a listing UUID, compact id, `/listings/…` path, or full SellNearby URL
 * into something the client can resolve for checkout.
 */
export function parseListingPayRef(raw: string): ParsedListingPayRef | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let candidate = trimmed;

  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      candidate = url.pathname;
    }
  } catch {
    return null;
  }

  const listingsMatch = candidate.match(/\/listings\/([^/?#]+)/i);
  if (listingsMatch?.[1]) {
    candidate = decodeURIComponent(listingsMatch[1]);
  } else if (candidate.startsWith('/')) {
    return null;
  }

  candidate = candidate.replace(/^\/+|\/+$/g, '');

  if (isBareListingId(candidate)) {
    return { kind: 'uuid', id: candidate.toLowerCase() };
  }

  const legacyUuid = parseListingRouteParam(candidate);
  if (legacyUuid) {
    return { kind: 'uuid', id: legacyUuid };
  }

  const compactId = extractListingCompactId(candidate);
  if (compactId) {
    return { kind: 'compact', compactId };
  }

  return null;
}
