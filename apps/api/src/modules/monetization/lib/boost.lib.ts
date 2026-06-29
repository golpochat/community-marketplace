import type {
  BoostPackageType,
  PlatformPricingConfig,
  PlatformPurchase,
} from '@community-marketplace/types';
import type { Prisma } from '@prisma/client';

import {
  computeExpiresAt,
  packageDurationDays,
} from '../../listings/lib/listing-lifecycle.lib';

export function computeBoostedUntil(
  currentBoostedUntil: Date | null | undefined,
  packageType: BoostPackageType,
  now = new Date(),
): Date {
  const durationDays = packageDurationDays(packageType);
  const base =
    currentBoostedUntil && currentBoostedUntil > now
      ? new Date(currentBoostedUntil)
      : new Date(now);
  const result = new Date(base);
  result.setDate(result.getDate() + durationDays);
  return result;
}

export function isListingBoosted(
  boostedUntil: Date | null | undefined,
  now = new Date(),
): boolean {
  return boostedUntil != null && boostedUntil > now;
}

export function computeBoostFulfillment(
  listing: { boostedUntil: Date | null },
  packageType: BoostPackageType,
  now = new Date(),
) {
  const boostedUntil = computeBoostedUntil(listing.boostedUntil, packageType, now);
  const expiresAt = computeExpiresAt(now, packageType);
  return { boostedUntil, expiresAt };
}

export const DEFAULT_PLATFORM_PRICING: PlatformPricingConfig = {
  currency: 'EUR',
  skus: {
    boost_7d: { amount: 1.99, enabled: true },
    boost_30d: { amount: 4.99, enabled: true },
    featured_homepage: { amount: 2.99, enabled: true },
    featured_category: { amount: 1.99, enabled: true },
    fast_track_verification: { amount: 2.99, enabled: true },
    store_slot_2: { amount: 4.99, enabled: true },
    store_slot_3: { amount: 4.99, enabled: true },
    store_bundle_3: { amount: 7.99, enabled: true },
    priority_message: { amount: 0.49, enabled: false },
    early_cashback_unlock: { amount: 0.99, enabled: false },
  },
  promos: { first_boost_discount_percent: 50 },
  featured: { homepage_slots_per_day: 8, category_slots_per_day: 4 },
};

export function parsePlatformPricing(value: unknown): PlatformPricingConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_PLATFORM_PRICING;
  }
  const raw = value as Partial<PlatformPricingConfig>;
  return {
    currency: raw.currency ?? DEFAULT_PLATFORM_PRICING.currency,
    skus: {
      ...DEFAULT_PLATFORM_PRICING.skus,
      ...(raw.skus ?? {}),
    },
    promos: { ...DEFAULT_PLATFORM_PRICING.promos, ...(raw.promos ?? {}) },
    featured: { ...DEFAULT_PLATFORM_PRICING.featured, ...(raw.featured ?? {}) },
  };
}

export function boostSkuKey(packageType: BoostPackageType): 'boost_7d' | 'boost_30d' {
  return packageType === 'PAID_7D' ? 'boost_7d' : 'boost_30d';
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function mapPlatformPurchase(row: {
  id: string;
  userId: string;
  type: string;
  status: string;
  amount: Prisma.Decimal;
  currency: string;
  listingId: string | null;
  packageType: string | null;
  providerPaymentId: string | null;
  fulfilledAt: Date | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}): PlatformPurchase {
  const metadata =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};

  return {
    id: row.id,
    userId: row.userId,
    type: row.type as PlatformPurchase['type'],
    status: row.status as PlatformPurchase['status'],
    amount: Number(row.amount),
    currency: row.currency,
    listingId: row.listingId ?? undefined,
    packageType: (row.packageType as BoostPackageType | null) ?? undefined,
    featuredPlacement:
      typeof metadata.placement === 'string'
        ? (metadata.placement as PlatformPurchase['featuredPlacement'])
        : undefined,
    categoryId: typeof metadata.categoryId === 'string' ? metadata.categoryId : undefined,
    providerPaymentId: row.providerPaymentId ?? undefined,
    fulfilledAt: row.fulfilledAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
