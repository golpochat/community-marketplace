import { describe, expect, it } from 'vitest';

import { parseListingPayRef } from './parse-listing-pay-ref';

describe('parseListingPayRef', () => {
  it('parses a bare UUID', () => {
    const id = 'e98b795e-1234-4abc-8def-0123456789ab';
    expect(parseListingPayRef(id)).toEqual({ kind: 'uuid', id });
  });

  it('parses a full listing URL with compact slug', () => {
    const parsed = parseListingPayRef(
      'https://sellnearby.ie/listings/test-items-e98b795e',
    );
    expect(parsed).toEqual({ kind: 'compact', compactId: 'e98b795e' });
  });

  it('parses a /listings path only', () => {
    const parsed = parseListingPayRef('/listings/sofa-dublin-aabbccdd');
    expect(parsed).toEqual({ kind: 'compact', compactId: 'aabbccdd' });
  });

  it('returns null for empty or unrelated input', () => {
    expect(parseListingPayRef('')).toBeNull();
    expect(parseListingPayRef('https://sellnearby.ie/account/purchases')).toBeNull();
    expect(parseListingPayRef('just some words')).toBeNull();
  });
});
