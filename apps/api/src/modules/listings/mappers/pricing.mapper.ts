import type { ListingPricingFields, PriceChangeLog } from '@community-marketplace/types';

import { mapListingPricingFields } from '../lib/listing-pricing.lib';

export function mapPricingFromListing(row: {
  price: { toNumber(): number } | number;
  originalPrice: { toNumber(): number } | number | null;
  salePrice: { toNumber(): number } | number | null;
  discountPercent: number | null;
}): ListingPricingFields {
  const mapped = mapListingPricingFields(row);
  return {
    price: mapped.price,
    originalPrice: mapped.originalPrice,
    salePrice: mapped.salePrice,
    discountPercent: mapped.discountPercent,
  };
}

export function mapPriceChangeLog(row: {
  id: string;
  listingId: string;
  sellerId: string;
  oldOriginalPrice: { toNumber(): number } | number | null;
  oldSalePrice: { toNumber(): number } | number | null;
  newOriginalPrice: { toNumber(): number } | number | null;
  newSalePrice: { toNumber(): number } | number | null;
  discountPercent: number | null;
  requiresReview: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNotes: string | null;
  reviewedById: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  listing?: { id: string; title: string; status: string };
  seller?: { id: string; displayName: string | null; email: string };
}): PriceChangeLog {
  return {
    id: row.id,
    listingId: row.listingId,
    sellerId: row.sellerId,
    oldOriginalPrice: row.oldOriginalPrice != null ? Number(row.oldOriginalPrice) : undefined,
    oldSalePrice: row.oldSalePrice != null ? Number(row.oldSalePrice) : undefined,
    newOriginalPrice: row.newOriginalPrice != null ? Number(row.newOriginalPrice) : undefined,
    newSalePrice: row.newSalePrice != null ? Number(row.newSalePrice) : undefined,
    discountPercent: row.discountPercent ?? undefined,
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
