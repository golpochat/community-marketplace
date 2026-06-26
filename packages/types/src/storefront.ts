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

export type StoreWeekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface StoreDayHours {
  closed?: boolean;
  open?: string;
  close?: string;
}

export interface StoreOpeningHours {
  timezone?: string;
  schedule: Partial<Record<StoreWeekday, StoreDayHours>>;
  note?: string;
}

export interface StoreContactInfo {
  city?: string;
  addressLine?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface StorefrontListing extends ListingSummary {
  viewCount?: number;
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
  sellerStatus?: import('./seller-verification').SellerStatus;
  available?: boolean;
  unavailableMessage?: string;
  contactListingId?: string;
  contact?: StoreContactInfo;
  openingHours?: StoreOpeningHours;
  sections: StoreSection[];
  policies: StorePolicy;
  analytics: StoreAnalytics;
  listings: StorefrontListing[];
  reviews: StoreReview[];
}
