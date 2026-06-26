import type { StoreSection } from '@community-marketplace/types';

export type CategoryListingRow = {
  id: string;
  categoryId: string;
  category: { id: string; name: string; slug: string } | null;
};

/** Build storefront tabs from listing categories (hidden when only one category). */
export function buildCategoryStoreSections(listings: CategoryListingRow[]): StoreSection[] {
  const groups = new Map<string, { name: string; slug: string; listingIds: string[] }>();

  for (const listing of listings) {
    if (!listing.category) continue;
    const key = listing.category.id;
    const existing = groups.get(key);
    if (existing) {
      existing.listingIds.push(listing.id);
    } else {
      groups.set(key, {
        name: listing.category.name,
        slug: listing.category.slug,
        listingIds: [listing.id],
      });
    }
  }

  if (groups.size < 2) return [];

  return [...groups.entries()]
    .sort(([, a], [, b]) => b.listingIds.length - a.listingIds.length)
    .map(([categoryId, group], order) => ({
      id: categoryId,
      name: group.name,
      slug: group.slug,
      listingIds: group.listingIds,
      order,
    }));
}
