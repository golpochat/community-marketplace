import { slugify } from './string';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Legacy URLs embed a full UUID at the end of the path segment. */
const UUID_SUFFIX_PATTERN =
  /([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

const COMPACT_ID_PATTERN = /^[0-9a-f]{8}$/i;
const COMPACT_SUFFIX_PATTERN = /-([0-9a-f]{8})$/i;

export const LISTING_COMPACT_ID_LENGTH = 8;
const MAX_TITLE_SLUG_LENGTH = 60;

/** Short stable suffix for listing URLs (matches storefront slug style). */
export function listingCompactId(id: string): string {
  const compact = id.replace(/[^0-9a-f]/gi, '').toLowerCase();
  return compact.slice(-LISTING_COMPACT_ID_LENGTH);
}

/** Build SEO-friendly listing path segment: `{title-slug}-{compact-id}`. */
export function buildListingSlug(title: string, id: string): string {
  const titleSlug = slugify(title).slice(0, MAX_TITLE_SLUG_LENGTH).replace(/-+$/, '');
  const suffix = listingCompactId(id);
  return titleSlug ? `${titleSlug}-${suffix}` : suffix;
}

export function isBareListingId(param: string): boolean {
  return UUID_PATTERN.test(param);
}

/** True when the route param matches the canonical slug for this listing. */
export function isCanonicalListingRouteParam(
  param: string,
  listing: { id: string; title: string },
): boolean {
  return param === buildListingSlug(listing.title, listing.id);
}

/** Extract listing UUID from bare id or legacy slug-id route param. */
export function parseListingRouteParam(param: string): string | null {
  if (isBareListingId(param)) return param.toLowerCase();
  const match = param.match(UUID_SUFFIX_PATTERN);
  return match?.[1]?.toLowerCase() ?? null;
}

/** Extract compact listing id from canonical slug, bare compact id, or legacy slug. */
export function extractListingCompactId(param: string): string | null {
  const legacyId = parseListingRouteParam(param);
  if (legacyId) return listingCompactId(legacyId);
  if (COMPACT_ID_PATTERN.test(param)) return param.toLowerCase();
  const match = param.match(COMPACT_SUFFIX_PATTERN);
  return match?.[1]?.toLowerCase() ?? null;
}

export function isLegacyFullUuidListingRouteParam(param: string): boolean {
  return !isBareListingId(param) && UUID_SUFFIX_PATTERN.test(param);
}

/**
 * Rewrite a legacy `{title}-{full-uuid}` route param to `{title}-{compact-id}`.
 * Returns null when the param is already compact, bare UUID, or not a listing id route.
 */
export function rewriteLegacyListingRouteParam(param: string): string | null {
  if (isBareListingId(param)) return null;
  const match = param.match(UUID_SUFFIX_PATTERN);
  if (!match?.[1] || match.index === undefined) return null;

  const rewritten = `${param.slice(0, match.index)}${listingCompactId(match[1])}`;
  return rewritten === param ? null : rewritten;
}
