import { describe, expect, it } from 'vitest';

import {
  formatIrelandListingLocationLabel,
  matchIrelandCounty,
  parseIrelandLocationLabel,
  resolveIrelandListingGeo,
} from './ireland-locations';

describe('ireland-locations', () => {
  it('matches county names and avoids Meath vs Westmeath collisions', () => {
    expect(matchIrelandCounty('Dublin')?.name).toBe('Dublin');
    expect(matchIrelandCounty('westmeath')?.name).toBe('Westmeath');
    expect(matchIrelandCounty('Mullingar, Westmeath')?.name).toBe('Westmeath');
  });

  it('parses town, county labels', () => {
    const parsed = parseIrelandLocationLabel('Dundrum, Dublin');
    expect(parsed?.county.name).toBe('Dublin');
    expect(parsed?.place?.name).toBe('Dundrum');
    expect(parsed?.label).toBe(
      formatIrelandListingLocationLabel('Dundrum', 'Dublin'),
    );
  });

  it('resolves geo from structured labels', () => {
    const geo = resolveIrelandListingGeo('Tralee, Kerry');
    expect(geo?.countyName).toBe('Kerry');
    expect(geo?.placeName).toBe('Tralee');
    expect(geo?.latitude).toBeCloseTo(52.2713, 3);
    expect(geo?.longitude).toBeCloseTo(-9.7026, 3);
  });

  it('returns null for unknown labels', () => {
    expect(parseIrelandLocationLabel('Atlantis')).toBeNull();
    expect(resolveIrelandListingGeo('')).toBeNull();
  });
});
