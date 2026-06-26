export type ListingStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "paused"
  | "expired"
  | "sold"
  | "ended"
  | "removed"
  | "rejected"
  | "flagged"
  | "under_investigation"
  | "suspended_seller";

export type ListingPackageType =
  | "FREE"
  | "PAID_7D"
  | "PAID_30D"
  | "PAID_60D"
  | "PAID_90D"
  | "PREMIUM_UNTIL_SOLD";

import type { RbacRole } from "./rbac";
import type {
  ListingDeliverySelection,
  ListingDeliveryState,
} from "./delivery";
import type { ListingPricingState } from "./pricing";

export type ListingCondition = "new" | "like_new" | "good" | "fair" | "poor";

export type ListingSortOption =
  | "newest"
  | "price_low_to_high"
  | "price_high_to_low"
  | "nearest"
  | "mileage_low_to_high"
  | "mileage_high_to_low"
  | "year_newest"
  | "year_oldest"
  | "highest_rating";

export type ListingFeedType =
  | "new_near_you"
  | "free_near_you"
  | "trending"
  | "recently_sold_near_you";

export type ListingAuditEventType =
  | "listing_created"
  | "listing_updated"
  | "listing_deleted"
  | "status_changed"
  | "listing_approved"
  | "listing_renewed"
  | "listing_changes_requested"
  | "listing_banned"
  | "listing_unbanned"
  | "image_added"
  | "image_removed"
  | "image_reordered";

export type ListingReportStatus =
  | "open"
  | "reviewing"
  | "resolved"
  | "dismissed";

export type ListingReportAction =
  | "ban_listing"
  | "warn_seller"
  | "dismiss"
  | "none";

export interface ListingLocation {
  label: string;
  latitude: number;
  longitude: number;
}

export interface ListingVehicleAttributes {
  make?: string;
  model?: string;
  year?: number;
  bodyType?: string;
  color?: string;
  engineSize?: number;
  fuelType?: string;
  transmission?: string;
  mileage?: number;
  mileageUnit?: "km" | "mi";
  chassis?: string;
  seats?: number;
  doors?: number;
  vin?: string;
  nctExpiry?: string;
  roadTaxExpiry?: string;
  owners?: number;
  auctionGrade?: string;
  isHybrid?: boolean;
  engineCc?: number;
  steering?: "RHD" | "LHD";
  /** Non-numeric or custom display values */
  yearText?: string;
  engineSizeText?: string;
  seatsText?: string;
  doorsText?: string;
  conditionLabel?: string;
  conditionSet?: boolean;
}

export interface ListingImage {
  id: string;
  listingId: string;
  url: string;
  cardUrl?: string;
  thumbUrl?: string;
  tinyUrl?: string;
  order: number;
}

export interface ListingReviewMessage {
  id: string;
  listingId: string;
  senderId: string;
  senderName?: string;
  senderRole: RbacRole;
  content: string;
  createdAt: string;
}

export interface ListingSellerSummary {
  id: string;
  displayName?: string;
  email: string;
  verified?: boolean;
  phoneVerified?: boolean;
  memberSince?: string;
  activeListingCount?: number;
  soldCount?: number;
  averageRating?: number;
  reviewCount?: number;
  isAmbassador?: boolean;
  isBusiness?: boolean;
  responseRate?: number;
  responseTimeMinutes?: number;
  phone?: string;
}

export interface ListingReviewContext {
  listing: Listing;
  messages: ListingReviewMessage[];
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
  seller?: ListingSellerSummary;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  salePrice?: number;
  discountPercent?: number;
  currency: string;
  categoryId: string;
  category?: Category;
  condition: ListingCondition;
  status: ListingStatus;
  isPaid: boolean;
  packageType: ListingPackageType;
  activatedAt?: string;
  expiresAt?: string;
  endedAt?: string;
  priceDroppedAt?: string;
  rejectionReason?: string;
  removalReason?: string;
  location: ListingLocation;
  images: ListingImage[];
  attributes?: ListingVehicleAttributes;
  deliveryOptions?: ListingDeliverySelection[];
  delivery?: ListingDeliveryState;
  pricing?: ListingPricingState;
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
  originalPrice?: number;
  salePrice?: number;
  discountPercent?: number;
  currency: string;
  location: ListingLocation;
  status: ListingStatus;
  condition: ListingCondition;
  categoryId: string;
  categorySlug?: string;
  imageUrl?: string;
  distanceKm?: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt?: string;
  activatedAt?: string;
  deliverySummary?: string;
  sellerVerified?: boolean;
  sellerBusiness?: boolean;
  sellerRating?: number;
  sellerReviewCount?: number;
  sellerSoldCount?: number;
  attributes?: ListingVehicleAttributes;
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
  deliveryAvailable?: boolean;
  deliveryCollection?: boolean;
  sellerVerified?: boolean;
  sellerBusiness?: boolean;
  minSellerRating?: number;
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  engineSize?: string;
  seats?: string;
  doors?: string;
  brand?: string;
  storage?: string;
  material?: string;
  serviceType?: string;
  clothingSize?: string;
  gender?: string;
  area?: string;
  freeOnly?: boolean;
}

export interface ListingAdminFilters {
  status?: ListingStatus;
  categoryId?: string;
  sellerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
