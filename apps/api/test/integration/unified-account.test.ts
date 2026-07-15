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

describe('deriveAccountSellingPhase', () => {
  it('returns buyer_only before seller opt-in', async () => {
    const { deriveAccountSellingPhase } = await import('@community-marketplace/types');
    expect(
      deriveAccountSellingPhase({
        started: false,
        startedAt: null,
        sellerStatus: 'unverified',
        businessStructure: null,
      }),
    ).toBe('buyer_only');
  });

  it('returns setup_in_progress after opt-in until verified', async () => {
    const { deriveAccountSellingPhase } = await import('@community-marketplace/types');
    expect(
      deriveAccountSellingPhase({
        started: true,
        startedAt: '2026-01-01T00:00:00.000Z',
        sellerStatus: 'unverified',
        businessStructure: 'individual',
      }),
    ).toBe('setup_in_progress');
    expect(
      deriveAccountSellingPhase({
        started: true,
        startedAt: '2026-01-01T00:00:00.000Z',
        sellerStatus: 'under_review',
        businessStructure: 'individual',
      }),
    ).toBe('setup_in_progress');
  });

  it('returns active_seller only when verified', async () => {
    const { deriveAccountSellingPhase, isSellerIdentityStepComplete } = await import(
      '@community-marketplace/types'
    );
    expect(
      deriveAccountSellingPhase({
        started: true,
        startedAt: '2026-01-01T00:00:00.000Z',
        sellerStatus: 'verified',
        businessStructure: 'individual',
      }),
    ).toBe('active_seller');
    expect(isSellerIdentityStepComplete('unverified')).toBe(false);
    expect(isSellerIdentityStepComplete('under_review')).toBe(true);
    expect(isSellerIdentityStepComplete('verified')).toBe(true);
  });
});
