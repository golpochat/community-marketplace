export interface SellerTrustProfile {
  sellerId: string;
  averageRating?: number;
  reviewCount: number;
  soldCount: number;
  verified?: boolean;
  phoneVerified?: boolean;
  sellerStatus?: import('./seller-verification').SellerStatus;
  memberSince?: string;
  activeListingCount?: number;
  responseRate?: number;
  responseTimeMinutes?: number;
  isAmbassador?: boolean;
  isBusiness?: boolean;
}

export interface BuyerTrustProfile {
  buyerId: string;
  averageRating?: number;
  reviewCount: number;
  completedTransactions: number;
  hasDisputes: boolean;
  phoneVerified: boolean;
  isCommunityMember: boolean;
  memberSince?: string;
}

export interface PendingReviewItem {
  listingId: string;
  listingTitle: string;
  paymentId?: string;
  counterpartyId: string;
  counterpartyName?: string;
  completedAt: string;
}
