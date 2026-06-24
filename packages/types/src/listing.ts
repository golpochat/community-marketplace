export type ListingStatus = 'draft' | 'active' | 'sold' | 'archived' | 'banned';

export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export type ListingSortOption =
  | 'newest'
  | 'price_low_to_high'
  | 'price_high_to_low'
  | 'nearest';

export type ListingFeedType =
  | 'new_near_you'
  | 'free_near_you'
  | 'trending'
  | 'recently_sold_near_you';

export type ListingAuditEventType =
  | 'listing_created'
  | 'listing_updated'
  | 'listing_deleted'
  | 'status_changed'
  | 'listing_banned'
  | 'listing_unbanned'
  | 'image_added'
  | 'image_removed'
  | 'image_reordered';

export type ListingReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export type ListingReportAction = 'ban_listing' | 'warn_seller' | 'dismiss' | 'none';

export interface ListingLocation {
  label: string;
  latitude: number;
  longitude: number;
}

export interface ListingImage {
  id: string;
  listingId: string;
  url: string;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  category?: Category;
  condition: ListingCondition;
  status: ListingStatus;
  location: ListingLocation;
  images: ListingImage[];
  viewCount: number;
  favoriteCount: number;
  moderationNotes?: string;
  bannedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListingSummary {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: ListingLocation;
  status: ListingStatus;
  condition: ListingCondition;
  categoryId: string;
  imageUrl?: string;
  distanceKm?: number;
  favoriteCount: number;
  createdAt: string;
}

export interface ListingUploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresInSeconds: number;
  optimizedUrl: string;
}

export interface ListingAnalytics {
  listingId: string;
  viewCount: number;
  favoriteCount: number;
}

export interface ListingReport {
  id: string;
  listingId: string;
  reporterId: string;
  reason: string;
  description?: string;
  status: ListingReportStatus;
  moderationNotes?: string;
  actionTaken?: ListingReportAction;
  resolvedById?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListingAuditLog {
  id: string;
  listingId: string;
  actorId?: string;
  eventType: ListingAuditEventType;
  fromStatus?: ListingStatus;
  toStatus?: ListingStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ListingSearchFilters {
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ListingCondition;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sort?: ListingSortOption;
  page?: number;
  limit?: number;
}

export interface ListingAdminFilters {
  status?: ListingStatus;
  categoryId?: string;
  sellerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
