/** Seller-owned storefront (account layer — not the public buyer page shape). */
export interface StoreContactSettings {
  phone?: string;
  email?: string;
  addressLine?: string;
  website?: string;
  showPhone?: boolean;
  showEmail?: boolean;
  showAddress?: boolean;
}

export interface SellerStore {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  location?: string;
  contact?: StoreContactSettings;
  openingHours?: import('./storefront').StoreOpeningHours;
  policies?: import('./storefront').StorePolicy;
  isPrimary: boolean;
  isFeatured?: boolean;
  featuredUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerStoreLimits {
  storeCount: number;
  storeSlotLimit: number;
  platformMaxStores: number;
  canCreateStore: boolean;
  requiresVerification: boolean;
  blockReason?: string;
}

export interface SellerStoresOverview {
  stores: SellerStore[];
  limits: SellerStoreLimits;
}

export const STORE_PLATFORM_MAX = 5;
