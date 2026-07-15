import { describe, expect, it } from 'vitest';

import {
  buildListingSlug,
  extractListingCompactId,
  isCanonicalListingRouteParam,
  listingCompactId,
  parseListingRouteParam,
  rewriteLegacyListingRouteParam,
} from '@community-marketplace/utils';

const LISTING_ID = '00000000-0000-4000-a000-000000000148';

describe('listing slug URLs', () => {
  it('builds compact slug without full uuid', () => {
    expect(buildListingSlug('Adult Road Bike (54cm)', LISTING_ID)).toBe(
      'adult-road-bike-54cm-00000148',
    );
  });

  it('extracts compact id from canonical slug', () => {
    expect(extractListingCompactId('adult-road-bike-54cm-00000148')).toBe('00000148');
  });

  it('parses legacy full uuid slug', () => {
    expect(
      parseListingRouteParam(
        'adult-road-bike-54cm-00000000-0000-4000-a000-000000000148',
      ),
    ).toBe(LISTING_ID);
  });

  it('treats legacy slug as non-canonical after compact format', () => {
    const listing = { id: LISTING_ID, title: 'Adult Road Bike (54cm)' };
    expect(
      isCanonicalListingRouteParam(
        'adult-road-bike-54cm-00000000-0000-4000-a000-000000000148',
        listing,
      ),
    ).toBe(false);
    expect(
      isCanonicalListingRouteParam('adult-road-bike-54cm-00000148', listing),
    ).toBe(true);
  });

  it('rewrites legacy full-uuid route params to compact form', () => {
    expect(
      rewriteLegacyListingRouteParam(
        'adult-road-bike-54cm-00000000-0000-4000-a000-000000000148',
      ),
    ).toBe('adult-road-bike-54cm-00000148');
  });

  it('does not rewrite canonical compact route params', () => {
    expect(rewriteLegacyListingRouteParam('adult-road-bike-54cm-00000148')).toBeNull();
  });
});
