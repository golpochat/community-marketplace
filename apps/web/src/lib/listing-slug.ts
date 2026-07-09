import { slugify } from '@community-marketplace/utils';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const UUID_SUFFIX_PATTERN =
  /([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

const MAX_TITLE_SLUG_LENGTH = 60;

/** Build SEO-friendly listing path segment: `{title-slug}-{uuid}`. */
export function buildListingSlug(title: string, id: string): string {
  const titleSlug = slugify(title).slice(0, MAX_TITLE_SLUG_LENGTH).replace(/-+$/, '');
  return titleSlug ? `${titleSlug}-${id}` : id;
}

export function buildListingPath(listing: { id: string; title: string }): string {
  return `/listings/${buildListingSlug(listing.title, listing.id)}`;
}

export function isBareListingId(param: string): boolean {
  return UUID_PATTERN.test(param);
}

/** Extract listing UUID from bare id or slug-id route param. */
export function parseListingRouteParam(param: string): string | null {
  if (isBareListingId(param)) return param;
  const match = param.match(UUID_SUFFIX_PATTERN);
  return match?.[1] ?? null;
}
