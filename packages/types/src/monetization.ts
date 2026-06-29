import type { PaymentMethod } from './payment';
import type { ListingPackageType } from './listing';

export type WalletTransactionType = 'cashback_earned' | 'expired';

export type CashbackGrantStatus = 'pending' | 'earned' | 'cancelled';

export type PlatformPurchaseType =
  | 'listing_boost'
  | 'featured_slot'
  | 'fast_track_verification'
  | 'store_slot_2'
  | 'store_slot_3'
  | 'store_bundle_3';

export type PlatformPurchaseStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export type BoostPackageType = Extract<ListingPackageType, 'PAID_7D' | 'PAID_30D'>;

export type FeaturedPlacement = 'homepage' | 'category';

export interface PlatformSkuConfig {
  amount: number;
  enabled: boolean;
}

export interface PlatformPricingConfig {
  currency: string;
  skus: {
    boost_7d: PlatformSkuConfig;
    boost_30d: PlatformSkuConfig;
    featured_homepage?: PlatformSkuConfig;
    featured_category?: PlatformSkuConfig;
    fast_track_verification?: PlatformSkuConfig;
    store_slot_2?: PlatformSkuConfig;
    store_slot_3?: PlatformSkuConfig;
    store_bundle_3?: PlatformSkuConfig;
    priority_message?: PlatformSkuConfig;
    early_cashback_unlock?: PlatformSkuConfig;
  };
  promos?: {
    first_boost_discount_percent?: number;
  };
  featured?: {
    homepage_slots_per_day?: number;
    category_slots_per_day?: number;
  };
}

export interface MonetizationSettings {
  id: string;
  defaultPlatformFeePercent: number;
  verifiedSellerFeePercent: number;
  cashbackPercent: number;
  coolingDays: number;
  maxCashbackPerOrder: number;
  maxCashbackPerMonth: number;
  cashbackEnabled: boolean;
  cashbackMinOrderAmount: number;
  allowedCashbackMethods: PaymentMethod[];
  pricing: PlatformPricingConfig;
  boostsEnabled: boolean;
  featuredEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformPurchase {
  id: string;
  userId: string;
  type: PlatformPurchaseType;
  status: PlatformPurchaseStatus;
  amount: number;
  currency: string;
  listingId?: string;
  packageType?: BoostPackageType;
  featuredPlacement?: FeaturedPlacement;
  categoryId?: string;
  providerPaymentId?: string;
  fulfilledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoostIntentResponse {
  purchase: PlatformPurchase;
  clientSecret: string;
}

export interface FeaturedIntentResponse {
  purchase: PlatformPurchase;
  clientSecret: string;
}

export interface FastTrackIntentResponse {
  purchase: PlatformPurchase;
  clientSecret: string;
}

export interface StoreSlotIntentResponse {
  purchase: PlatformPurchase;
  clientSecret: string;
}

export interface StoreSlotCatalogOption {
  sku: 'store_slot_2' | 'store_slot_3' | 'store_bundle_3';
  label: string;
  price: number;
  slotsGranted: number;
  eligible: boolean;
  reason?: string;
}

export interface StoreSlotCatalogResponse {
  currency: string;
  storeSlotLimit: number;
  storeCount: number;
  options: StoreSlotCatalogOption[];
}

export interface BoostCatalogOption {
  packageType: BoostPackageType;
  label: string;
  price: number;
  durationDays: number;
  eligible: boolean;
  reason?: string;
}

export interface BoostCatalogListing {
  id: string;
  status: string;
  boostedUntil?: string;
  isBoosted: boolean;
}

export interface BoostCatalogResponse {
  boostsEnabled: boolean;
  currency: string;
  options: BoostCatalogOption[];
  listing?: BoostCatalogListing;
}

export interface FeaturedCatalogOption {
  placement: FeaturedPlacement;
  label: string;
  price: number;
  durationHours: number;
  slotsPerDay: number;
  slotsUsed: number;
  slotsRemaining: number;
  eligible: boolean;
  reason?: string;
}

export interface FeaturedCatalogListing {
  id: string;
  status: string;
  categoryId: string;
  isFeatured: boolean;
  featuredUntil?: string;
  featuredPlacement?: FeaturedPlacement;
}

export interface FeaturedCatalogResponse {
  featuredEnabled: boolean;
  currency: string;
  options: FeaturedCatalogOption[];
  listing?: FeaturedCatalogListing;
}

export interface FastTrackStatusResponse {
  enabled: boolean;
  currency: string;
  price: number;
  eligible: boolean;
  reason?: string;
  hasPriority: boolean;
  pendingPurchase?: PlatformPurchase;
  nextEligibleAt?: string;
}

export interface SellerPlatformFeeInfo {
  effectiveFeePercent: number;
  isCustomOverride: boolean;
  defaultFeePercent: number;
  verifiedSellerFeePercent?: number;
  isVerifiedRate?: boolean;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTransactionType;
  amount: number;
  sourcePaymentId?: string;
  expiresAt?: string;
  creditSourceId?: string;
  createdAt: string;
}

export interface CashbackGrant {
  id: string;
  userId: string;
  paymentId: string;
  amount: number;
  status: CashbackGrantStatus;
  unlockAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingCashbackUnlock {
  grantId: string;
  paymentId: string;
  amount: number;
  unlockAt: string;
}

export interface BuyerWalletSummary {
  balance: number;
  pendingUnlocks: PendingCashbackUnlock[];
  recentTransactions: WalletTransaction[];
  cashbackPercent: number;
  coolingDays: number;
  cashbackEnabled: boolean;
}

export interface CashbackEstimate {
  eligible: boolean;
  amount: number;
  unlockAt: string;
  cashbackPercent: number;
  reason?: string;
}

export const BOOST_PACKAGE_TYPES = ['PAID_7D', 'PAID_30D'] as const;

export const FEATURED_PLACEMENTS = ['homepage', 'category'] as const;

export function isBoostPackageType(value: string): value is BoostPackageType {
  return value === 'PAID_7D' || value === 'PAID_30D';
}

export function isFeaturedPlacement(value: string): value is FeaturedPlacement {
  return value === 'homepage' || value === 'category';
}
