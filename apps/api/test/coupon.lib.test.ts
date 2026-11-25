import { describe, expect, it } from 'vitest';

import {
  isPurchaseTypeAllowed,
  normalizeCouponCode,
  quoteCouponDiscount,
} from '../src/modules/monetization/lib/coupon.lib';

describe('coupon.lib', () => {
  it('normalizes codes to uppercase trimmed', () => {
    expect(normalizeCouponCode('  pilot20 ')).toBe('PILOT20');
  });

  it('quotes percent discounts', () => {
    expect(
      quoteCouponDiscount({
        discountType: 'percent',
        discountValue: 50,
        baseAmount: 1.99,
      }),
    ).toEqual({ finalAmount: 0.99, amountSaved: 1 });
  });

  it('quotes fixed discounts without going below zero', () => {
    expect(
      quoteCouponDiscount({
        discountType: 'fixed',
        discountValue: 5,
        baseAmount: 2.99,
      }),
    ).toEqual({ finalAmount: 0, amountSaved: 2.99 });
  });

  it('allows all purchase types when allowlist is empty', () => {
    expect(isPurchaseTypeAllowed([], 'listing_boost')).toBe(true);
    expect(isPurchaseTypeAllowed(null, 'featured_slot')).toBe(true);
  });

  it('enforces SKU allowlist', () => {
    expect(isPurchaseTypeAllowed(['listing_boost'], 'listing_boost')).toBe(true);
    expect(isPurchaseTypeAllowed(['listing_boost'], 'featured_slot')).toBe(false);
  });
});
