import type { ListingSummary } from './listing';

export interface StoreSection {
  id: string;
  name: string;
  slug: string;
  listingIds: string[];
  order: number;
}

export interface StoreReview {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface StorePolicy {
  returns?: string;
  shipping?: string;
  responseTime?: string;
}

export interface StoreAnalytics {
  totalViews: number;
  totalSales: number;
  averageRating: number;
  reviewCount: number;
}

export interface SellerStorefront {
  id: string;
  sellerId: string;
  slug: string;
  name: string;
  tagline?: string;
  description: string;
  bannerUrl?: string;
  logoUrl?: string;
  location?: string;
  memberSince: string;
  verified: boolean;
  sections: StoreSection[];
  policies: StorePolicy;
  analytics: StoreAnalytics;
  listings: ListingSummary[];
  reviews: StoreReview[];
}
