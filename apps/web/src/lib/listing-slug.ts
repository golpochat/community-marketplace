import {
  buildListingSlug,
  isBareListingId,
  isCanonicalListingRouteParam,
  parseListingRouteParam,
  extractListingCompactId,
  listingCompactId,
  rewriteLegacyListingRouteParam,
} from '@community-marketplace/utils';

export {
  buildListingSlug,
  isBareListingId,
  isCanonicalListingRouteParam,
  parseListingRouteParam,
  extractListingCompactId,
  listingCompactId,
  rewriteLegacyListingRouteParam,
};

export function buildListingPath(listing: { id: string; title: string }): string {
  return `/listings/${buildListingSlug(listing.title, listing.id)}`;
}
