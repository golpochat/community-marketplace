import type {
  DeliveryChangeLog,
  DeliveryOption,
  DeliveryPreview,
  ListingDeliverySelection,
} from '@community-marketplace/types';

type DeliveryOptionRow = {
  id: string;
  label: string;
  description: string;
  zone: 'COLLECTION' | 'LOCAL' | 'NATIONAL' | 'CUSTOM';
  defaultPrice: { toNumber(): number } | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ListingDeliveryRow = {
  id: string;
  listingId: string;
  deliveryOptionId: string;
  customLabel: string | null;
  customPrice: { toNumber(): number } | null;
  deliveryOption: DeliveryOptionRow;
};

export function mapDeliveryOption(row: DeliveryOptionRow): DeliveryOption {
  return {
    id: row.id,
    label: row.label,
    description: row.description,
    zone: row.zone,
    defaultPrice: row.defaultPrice != null ? Number(row.defaultPrice) : undefined,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapListingDeliverySelection(row: ListingDeliveryRow): ListingDeliverySelection {
  const price =
    row.customPrice != null
      ? Number(row.customPrice)
      : row.deliveryOption.defaultPrice != null
        ? Number(row.deliveryOption.defaultPrice)
        : undefined;

  return {
    id: row.id,
    deliveryOptionId: row.deliveryOptionId,
    customLabel: row.customLabel ?? undefined,
    customPrice: row.customPrice != null ? Number(row.customPrice) : undefined,
    label: row.customLabel ?? row.deliveryOption.label,
    zone: row.deliveryOption.zone,
    price,
  };
}

export function buildDeliveryDiff(
  current: ListingDeliverySelection[],
  proposed: ListingDeliverySelection[],
): DeliveryPreview['diff'] {
  const key = (item: ListingDeliverySelection) =>
    `${item.deliveryOptionId}:${item.customLabel ?? ''}:${item.customPrice ?? item.price ?? ''}`;

  const currentKeys = new Set(current.map(key));
  const proposedKeys = new Set(proposed.map(key));

  const added = proposed.filter((item) => !currentKeys.has(key(item)));
  const removed = current.filter((item) => !proposedKeys.has(key(item)));

  const changed: Array<{ before: ListingDeliverySelection; after: ListingDeliverySelection }> = [];
  for (const after of proposed) {
    const before = current.find(
      (item) =>
        item.deliveryOptionId === after.deliveryOptionId &&
        (item.customLabel ?? '') === (after.customLabel ?? '') &&
        key(item) !== key(after),
    );
    if (before) changed.push({ before, after });
  }

  return { added, removed, changed };
}

export function mapDeliveryChangeLog(row: {
  id: string;
  listingId: string;
  sellerId: string;
  changes: unknown;
  requiresReview: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNotes: string | null;
  reviewedById: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  listing?: { id: string; title: string; status: string };
  seller?: { id: string; displayName: string | null; email: string };
}): DeliveryChangeLog {
  return {
    id: row.id,
    listingId: row.listingId,
    sellerId: row.sellerId,
    changes: row.changes as DeliveryChangeLog['changes'],
    requiresReview: row.requiresReview,
    status: row.status,
    reviewNotes: row.reviewNotes ?? undefined,
    reviewedById: row.reviewedById ?? undefined,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString(),
    listing: row.listing,
    seller: row.seller
      ? {
          id: row.seller.id,
          displayName: row.seller.displayName ?? undefined,
          email: row.seller.email,
        }
      : undefined,
  };
}

export const listingDeliveryInclude = {
  deliveryOption: true,
} as const;
