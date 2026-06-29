/** Seller-owned storefront (account layer — not the public buyer page shape). */
export interface SellerStore {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  location?: string;
  isPrimary: boolean;
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
