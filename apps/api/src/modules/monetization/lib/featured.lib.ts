import type { FeaturedPlacement } from '@community-marketplace/types';

export const FEATURED_DURATION_HOURS = 24;

export function computeFeaturedUntil(
  currentFeaturedUntil: Date | null | undefined,
  now = new Date(),
): Date {
  const base =
    currentFeaturedUntil && currentFeaturedUntil > now
      ? new Date(currentFeaturedUntil)
      : new Date(now);
  const result = new Date(base);
  result.setHours(result.getHours() + FEATURED_DURATION_HOURS);
  return result;
}

export function isListingFeatured(
  listing: {
    isFeatured: boolean;
    featuredUntil: Date | null | undefined;
  },
  now = new Date(),
): boolean {
  return (
    listing.isFeatured &&
    listing.featuredUntil != null &&
    listing.featuredUntil > now
  );
}

export function isStoreFeatured(
  store: {
    isFeatured: boolean;
    featuredUntil: Date | null | undefined;
  },
  now = new Date(),
): boolean {
  return (
    store.isFeatured &&
    store.featuredUntil != null &&
    store.featuredUntil > now
  );
}

export function featuredSkuKey(
  placement: FeaturedPlacement,
): 'featured_homepage' | 'featured_category' {
  return placement === 'homepage' ? 'featured_homepage' : 'featured_category';
}

export function storeHomepageSlotsPerDay(config: {
  store_homepage_slots_per_day?: number;
}): number {
  return config.store_homepage_slots_per_day ?? 6;
}

export function buildActiveFeaturedStoreWhere(now: Date) {
  return {
    isFeatured: true,
    featuredUntil: { gt: now },
  };
}

export function slotsPerDayForPlacement(
  placement: FeaturedPlacement,
  config: {
    homepage_slots_per_day?: number;
    category_slots_per_day?: number;
  },
): number {
  if (placement === 'homepage') {
    return config.homepage_slots_per_day ?? 8;
  }
  return config.category_slots_per_day ?? 4;
}

export interface FeaturedSlotCountParams {
  isFeatured: boolean;
  featuredUntil: { gt: Date };
  featuredPlacement: FeaturedPlacement;
  status: 'active';
  categoryId?: string;
}

export function buildActiveFeaturedWhere(
  placement: FeaturedPlacement,
  now: Date,
  categoryId?: string,
) {
  return {
    isFeatured: true,
    featuredUntil: { gt: now },
    featuredPlacement: placement,
    status: 'active' as const,
    ...(placement === 'category' && categoryId ? { categoryId } : {}),
  };
}
