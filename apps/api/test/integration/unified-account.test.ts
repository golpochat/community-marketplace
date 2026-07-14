import { describe, expect, it } from 'vitest';

import {
  canActAsBuyer,
  canEnterSellerNamespace,
  hasLegacySellerRole,
} from '@community-marketplace/types';

import {
  hasAnyRole,
  roleSatisfiesRequirement,
} from '../../src/common/authorization/domain/effective-permissions';

describe('unified marketplace role mapping', () => {
  it('treats MEMBER as satisfying legacy BUYER and SELLER namespace requirements', () => {
    expect(roleSatisfiesRequirement('MEMBER', 'BUYER')).toBe(true);
    expect(roleSatisfiesRequirement('MEMBER', 'SELLER')).toBe(true);
    expect(roleSatisfiesRequirement('MEMBER', 'MEMBER')).toBe(true);
  });

  it('allows MEMBER through RequireRole buyer and seller checks', () => {
    expect(hasAnyRole('MEMBER', ['BUYER'])).toBe(true);
    expect(hasAnyRole('MEMBER', ['SELLER'])).toBe(true);
    expect(hasAnyRole('MEMBER', ['ADMIN'])).toBe(false);
  });

  it('keeps legacy SELLER able to buy after unified account migration', () => {
    expect(canActAsBuyer('SELLER')).toBe(true);
    expect(hasLegacySellerRole('SELLER')).toBe(true);
    expect(canEnterSellerNamespace('MEMBER')).toBe(true);
    expect(hasLegacySellerRole('MEMBER')).toBe(false);
  });
});

describe('marketplace account helpers', () => {
  it('defaults MEMBER to buyer behaviour and seller namespace entry', () => {
    expect(canActAsBuyer('MEMBER')).toBe(true);
    expect(canEnterSellerNamespace('MEMBER')).toBe(true);
    expect(canActAsBuyer('ADMIN')).toBe(false);
  });
});
