import { describe, expect, it } from 'vitest';

import { isPublicStorefrontOwnerRole } from '../src/modules/listings/services/stores.service';

describe('public storefront owner roles', () => {
  it('resolves storefronts for unified MEMBER sellers, not only legacy SELLER', () => {
    expect(isPublicStorefrontOwnerRole('MEMBER')).toBe(true);
    expect(isPublicStorefrontOwnerRole('SELLER')).toBe(true);
  });

  it('does not treat buyers or staff as public storefront owners', () => {
    expect(isPublicStorefrontOwnerRole('BUYER')).toBe(false);
    expect(isPublicStorefrontOwnerRole('ADMIN')).toBe(false);
    expect(isPublicStorefrontOwnerRole(undefined)).toBe(false);
    expect(isPublicStorefrontOwnerRole('')).toBe(false);
  });
});
