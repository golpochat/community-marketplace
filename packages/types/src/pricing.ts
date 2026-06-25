export type PriceChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PriceUpdateStatus = 'auto-approved' | 'pending-review';

export interface ListingPricingFields {
  price: number;
  originalPrice?: number;
  salePrice?: number;
  discountPercent?: number;
}

export interface ListingPricingState {
  pricing: ListingPricingFields;
  pendingPricing?: ListingPricingFields;
  priceReviewStatus?: 'none' | 'pending-review' | 'rejected';
  pendingChangeLogId?: string;
  reviewNotes?: string;
}

export interface PricingPreview {
  listingId: string;
  listingTitle: string;
  listingStatus: string;
  current: ListingPricingFields;
  proposed: ListingPricingFields;
  savingsAmount?: number;
  badgeLabel?: string;
  wouldRequireReview: boolean;
  reviewReasons: string[];
}

export interface PriceUpdateResult {
  status: PriceUpdateStatus;
  preview: PricingPreview;
  changeLogId?: string;
  pricing: ListingPricingFields;
  pendingPricing?: ListingPricingFields;
}

export interface PriceChangeLog {
  id: string;
  listingId: string;
  sellerId: string;
  oldOriginalPrice?: number;
  oldSalePrice?: number;
  newOriginalPrice?: number;
  newSalePrice?: number;
  discountPercent?: number;
  requiresReview: boolean;
  status: PriceChangeStatus;
  reviewNotes?: string;
  reviewedById?: string;
  createdAt: string;
  reviewedAt?: string;
  listing?: { id: string; title: string; status: string };
  seller?: { id: string; displayName?: string; email: string };
}
