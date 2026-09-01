import type { ListingCondition, ListingStatus } from '../../generated/prisma';

import { DEV_BOOTSTRAP_USER_IDS } from './dev-users.seed.data';
import { DEV_CATEGORY_SEED } from './dev-categories.seed.data';

export const TEST_DATA_USER_IDS = {
  sellerUnverified: '00000000-0000-4000-8000-000000000017',
  sellerSuspended: '00000000-0000-4000-8000-000000000018',
} as const;

export const TEST_DATA_STORE_IDS = {
  demoPrimary: '00000000-0000-4000-9000-000000000001',
  sellerUnverified: '00000000-0000-4000-9000-000000000002',
  sellerSuspended: '00000000-0000-4000-9000-000000000003',
  demoSecondary: '00000000-0000-4000-9000-000000000004',
} as const;

export const TEST_DATA_LISTING_IDS = {
  draftElectronics: '00000000-0000-4000-9000-000000000010',
  pendingReviewFurniture: '00000000-0000-4000-9000-000000000011',
  activeElectronics: '00000000-0000-4000-9000-000000000012',
  activeVehicles: '00000000-0000-4000-9000-000000000013',
  pausedClothing: '00000000-0000-4000-9000-000000000014',
  expiredHomeGarden: '00000000-0000-4000-9000-000000000015',
  soldElectronics: '00000000-0000-4000-9000-000000000016',
  endedOther: '00000000-0000-4000-9000-000000000017',
  removedSports: '00000000-0000-4000-9000-000000000018',
  rejectedServices: '00000000-0000-4000-9000-000000000019',
  flaggedElectronics: '00000000-0000-4000-9000-000000000020',
  underInvestigationVehicles: '00000000-0000-4000-9000-000000000021',
  suspendedSellerListing: '00000000-0000-4000-9000-000000000022',
  activeDeliveryReview: '00000000-0000-4000-9000-000000000023',
  activePriceReview: '00000000-0000-4000-9000-000000000024',
  activeFeatured: '00000000-0000-4000-9000-000000000025',
  activeUnverifiedGate: '00000000-0000-4000-9000-000000000026',
} as const;

export const TEST_DATA_ENTITY_IDS = {
  paymentSold: '00000000-0000-4000-9000-000000000100',
  chatThread: '00000000-0000-4000-9000-000000000200',
  chatMessageBuyer: '00000000-0000-4000-9000-000000000201',
  chatMessageSeller: '00000000-0000-4000-9000-000000000202',
  chatMessageFlagged: '00000000-0000-4000-9000-000000000203',
  marketplaceDispute: '00000000-0000-4000-9000-000000000300',
  moderationReportListing: '00000000-0000-4000-9000-000000000400',
  moderationReportMessage: '00000000-0000-4000-9000-000000000401',
  fraudSignal: '00000000-0000-4000-9000-000000000500',
  adminInvitation: '00000000-0000-4000-9000-000000000600',
  buyerVerification: '00000000-0000-4000-9000-000000000700',
  sellerVerificationRequest: '00000000-0000-4000-9000-000000000800',
  deliveryChangeLog: '00000000-0000-4000-9000-000000000900',
  priceChangeLog: '00000000-0000-4000-9000-000000000901',
  cashbackGrant: '00000000-0000-4000-9000-000000000902',
  buyerWallet: '00000000-0000-4000-9000-000000000903',
} as const;

export const TEST_DATA_DELIVERY_OPTION_IDS = {
  collection: '00000000-0000-4000-8000-000000000200',
  nationwide: '00000000-0000-4000-8000-000000000202',
} as const;

export const TEST_DATA_USERS = {
  demoSeller: DEV_BOOTSTRAP_USER_IDS.SELLER,
  demoBuyer: DEV_BOOTSTRAP_USER_IDS.BUYER,
  superAdmin: DEV_BOOTSTRAP_USER_IDS.SUPER_ADMIN,
  moderationAdmin: DEV_BOOTSTRAP_USER_IDS.MODERATION_ADMIN,
} as const;

export const DUBLIN_LOCATION = {
  label: 'Dublin, Ireland',
  latitude: 53.3498,
  longitude: -6.2603,
} as const;

export const TEST_ADDITIONAL_USERS = [
  {
    id: TEST_DATA_USER_IDS.sellerUnverified,
    role: 'SELLER' as const,
    email: 'seller-unverified@community.market',
    password: 'ChangeMe!Seller2',
    displayName: 'Unverified Seller',
    phone: '+353871000003',
    sellerStatus: 'unverified' as const,
  },
  {
    id: TEST_DATA_USER_IDS.sellerSuspended,
    role: 'SELLER' as const,
    email: 'seller-suspended@community.market',
    password: 'ChangeMe!Seller3',
    displayName: 'Suspended Seller',
    phone: '+353871000004',
    sellerStatus: 'suspended' as const,
  },
] as const;

export interface TestListingSeed {
  id: string;
  status: ListingStatus;
  categorySlug: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  salePrice?: number;
  condition: ListingCondition;
  sellerId: string;
  storeId: string;
  rejectionReason?: string;
  removalReason?: string;
  requiresFraudReview?: boolean;
  moderationHiddenAt?: boolean;
  isFeatured?: boolean;
  boostedUntilDays?: number;
  expiredDaysAgo?: number;
  attributes?: Record<string, unknown>;
  bannedAt?: boolean;
}

function categoryId(slug: string): string {
  const row = DEV_CATEGORY_SEED.find((entry: (typeof DEV_CATEGORY_SEED)[number]) => entry.slug === slug);
  if (!row) {
    throw new Error(`Unknown category slug: ${slug}`);
  }
  return row.id;
}

const now = new Date();
const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

export const TEST_LISTINGS: TestListingSeed[] = [
  {
    id: TEST_DATA_LISTING_IDS.draftElectronics,
    status: 'draft',
    categorySlug: 'electronics',
    title: '[Test] Draft Bluetooth Speaker',
    description: 'Seeded draft listing for seller create/edit flows.',
    price: 45,
    condition: 'good',
    sellerId: TEST_DATA_USERS.demoSeller,
    storeId: TEST_DATA_STORE_IDS.demoPrimary,
  },
  {
    id: TEST_DATA_LISTING_IDS.pendingReviewFurniture,
    status: 'pending_review',
    categorySlug: 'furniture',
    title: '[Test] Pending Oak Desk',
    description: 'Seeded listing awaiting moderation approval.',
    price: 120,
    condition: 'like_new',
    sellerId: TEST_DATA_USERS.demoSeller,
    storeId: TEST_DATA_STORE_IDS.demoPrimary,
  },
  {
    id: TEST_DATA_LISTING_IDS.activeElectronics,
    status: 'active',
    categorySlug: 'electronics',
    title: '[Test] Active Wireless Headphones',
    description: 'Primary active listing for search, chat, and checkout.',
    price: 89.99,
    condition: 'like_new',
    sellerId: TEST_DATA_USERS.demoSeller,
    storeId: TEST_DATA_STORE_IDS.demoPrimary,
  },
  {
    id: TEST_DATA_LISTING_IDS.activeVehicles,
    status: 'active',
    categorySlug: 'vehicles',
    title: '[Test] 2018 Toyota Corolla',
    description: 'Vehicle listing with full attributes for form and VIN rules.',
    price: 12500,
    condition: 'good',
    sellerId: TEST_DATA_USERS.demoSeller,
    storeId: TEST_DATA_STORE_IDS.demoPrimary,
    attributes: {
      make: 'Toyota',
      model: 'Corolla',
      year: 2018,
      bodyType: 'saloon',
      fuelType: 'petrol',
      transmission: 'manual',
      mileage: 62000,
      mileageUnit: 'km',
      vin: 'TESTVIN0000000001',
      steering: 'RHD',
    },
  },
  {
    id: TEST_DATA_LISTING_IDS.pausedClothing,
    status: 'paused',
    categorySlug: 'clothing',
    title: '[Test] Paused Winter Jacket',
    description: 'Paused listing for resume and boost eligibility tests.',
    price: 55,
    condition: 'good',
    sellerId: TEST_DATA_USERS.demoSeller,
    storeId: TEST_DATA_STORE_IDS.demoPrimary,
  },
  {
    id: TEST_DATA_LISTING_IDS.expiredHomeGarden,
    status: 'expired',
    categorySlug: 'home-garden',
    title: '[Test] Expired Garden Tools Set',
    description: 'Expired listing for renewal workflow.',
    price: 35,
    condition: 'fair',
    sellerId: TEST_DATA_USERS.demoSeller,
    storeId: TEST_DATA_STORE_IDS.demoPrimary,
    expiredDaysAgo: 3,
  },
  {
    id: TEST_DATA_LISTING_IDS.soldElectronics,
    status: 'sold',
    categorySlug: 'electronics',
    title: '[Test] Sold Tablet',
    description: 'Sold listing linked to a succeeded payment and dispute.',
    price: 199,
    condition: 'good',
    sellerId: TEST_DATA_USERS.demoSeller,
    storeId: TEST_DATA_STORE_IDS.demoPrimary,
  },
  {
    id: TEST_DATA_LISTING_IDS.endedOther,
    status: 'ended',
    categorySlug: 'other',
    title: '[Test] Ended Misc Item',
    description: 'Seller-ended terminal listing.',
    price: 15,
    condition: 'fair',
    sellerId: TEST_DATA_USERS.demoSeller,
    storeId: TEST_DATA_STORE_IDS.demoPrimary,
  },
  {
    id: TEST_DATA_LISTING_IDS.removedSports,
    status: 'removed',
    categorySlug: 'sports-outdoors',
    title: '[Test] Removed Bike',
    description: 'Admin-removed listing for restore workflow.',
    price: 250,
    condition: 'good',
    sellerId: TEST_DATA_USERS.demoSeller,
    storeId: TEST_DATA_STORE_IDS.demoPrimary,
    removalReason: 'Policy violation (seeded)',
    bannedAt: true,
  },
  {
    id: TEST_DATA_LISTING_IDS.rejectedServices,
    status: 'rejected',
    categorySlug: 'services',
    title: '[Test] Rejected Cleaning Service',
    description: 'Rejected listing for seller resubmit flow.',
    price: 40,
    condition: 'new',
    sellerId: TEST_DATA_USERS.demoSeller,
    storeId: TEST_DATA_STORE_IDS.demoPrimary,
    rejectionReason: 'Incomplete service description (seeded)',
  },
  {
    id: TEST_DATA_LISTING_IDS.flaggedElectronics,
    status: 'flagged',
    categorySlug: 'electronics',
    title: '[Test] Flagged Gaming Console',
    description: 'Flagged for fraud and moderation queue testing.',
    price: 299,
    condition: 'like_new',
    sellerId: TEST_DATA_USERS.demoSeller,
    storeId: TEST_DATA_STORE_IDS.demoPrimary,
    requiresFraudReview: true,
  },
  {
    id: TEST_DATA_LISTING_IDS.underInvestigationVehicles,
    status: 'under_investigation',
    categorySlug: 'vehicles',
    title: '[Test] Under Investigation Van',
    description: 'Hidden listing under admin investigation.',
    price: 8900,
    condition: 'good',
    sellerId: TEST_DATA_USERS.demoSeller,
    storeId: TEST_DATA_STORE_IDS.demoPrimary,
    moderationHiddenAt: true,
    attributes: {
      make: 'Ford',
      model: 'Transit',
      year: 2016,
      vin: 'TESTVIN0000000002',
    },
  },
  {
    id: TEST_DATA_LISTING_IDS.suspendedSellerListing,
    status: 'suspended_seller',
    categorySlug: 'electronics',
    title: '[Test] Suspended Seller Laptop',
    description: 'Listing on a suspended seller account.',
    price: 450,
    condition: 'good',
    sellerId: TEST_DATA_USER_IDS.sellerSuspended,
    storeId: TEST_DATA_STORE_IDS.sellerSuspended,
  },
  {
    id: TEST_DATA_LISTING_IDS.activeDeliveryReview,
    status: 'active',
    categorySlug: 'electronics',
    title: '[Test] Delivery Review Camera',
    description: 'Active listing with a pending delivery change review.',
    price: 320,
    condition: 'like_new',
    sellerId: TEST_DATA_USERS.demoSeller,
    storeId: TEST_DATA_STORE_IDS.demoPrimary,
  },
  {
    id: TEST_DATA_LISTING_IDS.activePriceReview,
    status: 'active',
    categorySlug: 'electronics',
    title: '[Test] Price Review TV',
    description: 'Active listing with a pending price change review.',
    price: 400,
    originalPrice: 800,
    salePrice: 400,
    condition: 'good',
    sellerId: TEST_DATA_USERS.demoSeller,
    storeId: TEST_DATA_STORE_IDS.demoPrimary,
  },
  {
    id: TEST_DATA_LISTING_IDS.activeFeatured,
    status: 'active',
    categorySlug: 'electronics',
    title: '[Test] Featured Smart Watch',
    description: 'Boosted and featured monetization display listing.',
    price: 149,
    condition: 'new',
    sellerId: TEST_DATA_USERS.demoSeller,
    storeId: TEST_DATA_STORE_IDS.demoPrimary,
    isFeatured: true,
    boostedUntilDays: 14,
  },
  {
    id: TEST_DATA_LISTING_IDS.activeUnverifiedGate,
    status: 'active',
    categorySlug: 'electronics',
    title: '[Test] Unverified Seller Phone',
    description: 'Fourth active listing on unverified seller for gate testing.',
    price: 75,
    condition: 'good',
    sellerId: TEST_DATA_USER_IDS.sellerUnverified,
    storeId: TEST_DATA_STORE_IDS.sellerUnverified,
  },
];

export function resolveCategoryId(slug: string): string {
  return categoryId(slug);
}

export { daysFromNow, daysAgo };
