import type { PrismaClient } from '../../generated/prisma';

import { revalidateListingCache, type RevalidateListingCacheOptions } from './clean-pilot-listing-titles';

export interface CleanListingDeliveryConflictsOptions extends RevalidateListingCacheOptions {
  revalidateCache?: boolean;
  /** When true, only report conflicts without deleting. */
  dryRun?: boolean;
}

export interface CleanListingDeliveryConflictsResult {
  conflictedListings: number;
  collectionRowsRemoved: number;
  revalidated: number;
  listingIds: string[];
}

/**
 * Remove COLLECTION delivery rows from listings that also have shipping options.
 * Matches API rule: Collection Only cannot combine with other delivery options.
 */
export async function cleanListingDeliveryConflicts(
  prisma: PrismaClient,
  options: CleanListingDeliveryConflictsOptions = {},
): Promise<CleanListingDeliveryConflictsResult> {
  const rows = await prisma.listingDeliveryOption.findMany({
    select: {
      id: true,
      listingId: true,
      deliveryOption: { select: { zone: true } },
    },
  });

  const byListing = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byListing.get(row.listingId) ?? [];
    list.push(row);
    byListing.set(row.listingId, list);
  }

  const conflictedIds: string[] = [];
  const deleteIds: string[] = [];

  for (const [listingId, listingRows] of byListing) {
    const hasCollection = listingRows.some((row) => row.deliveryOption.zone === 'COLLECTION');
    const hasShipping = listingRows.some((row) => row.deliveryOption.zone !== 'COLLECTION');
    if (!hasCollection || !hasShipping) continue;

    conflictedIds.push(listingId);
    for (const row of listingRows) {
      if (row.deliveryOption.zone === 'COLLECTION') {
        deleteIds.push(row.id);
      }
    }
  }

  if (!options.dryRun && deleteIds.length > 0) {
    await prisma.listingDeliveryOption.deleteMany({
      where: { id: { in: deleteIds } },
    });
  }

  let revalidated = 0;
  const shouldRevalidate = options.revalidateCache !== false && !options.dryRun;
  if (shouldRevalidate) {
    for (const listingId of conflictedIds) {
      const ok = await revalidateListingCache(listingId, options);
      if (ok) revalidated += 1;
    }
  }

  return {
    conflictedListings: conflictedIds.length,
    collectionRowsRemoved: options.dryRun ? 0 : deleteIds.length,
    revalidated,
    listingIds: conflictedIds,
  };
}
