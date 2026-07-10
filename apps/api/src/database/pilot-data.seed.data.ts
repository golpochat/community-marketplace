import type { ListingCondition } from '../../generated/prisma';

import { DEV_BOOTSTRAP_USER_IDS } from './dev-users.seed.data';
import { DEV_CATEGORY_SEED } from './dev-categories.seed.data';
import { TEST_DATA_STORE_IDS } from './test-data.seed.data';

export const PILOT_PASSWORD = 'ChangeMe!Pilot1';

export const PILOT_DELIVERY_OPTION_IDS = {
  collection: '00000000-0000-4000-8000-000000000200',
  nationwide: '00000000-0000-4000-8000-000000000202',
} as const;

export const PILOT_SELLER_IDS = {
  demo: DEV_BOOTSTRAP_USER_IDS.SELLER,
  cork: '00000000-0000-4000-a000-000000000002',
  galway: '00000000-0000-4000-a000-000000000003',
  limerick: '00000000-0000-4000-a000-000000000004',
  kilkenny: '00000000-0000-4000-a000-000000000005',
} as const;

export const PILOT_BUYER_IDS = {
  demo: DEV_BOOTSTRAP_USER_IDS.BUYER,
  dublin: '00000000-0000-4000-a000-000000000006',
  cork: '00000000-0000-4000-a000-000000000007',
  galway: '00000000-0000-4000-a000-000000000008',
  waterford: '00000000-0000-4000-a000-000000000009',
} as const;

export const PILOT_STORE_IDS = {
  demo: TEST_DATA_STORE_IDS.demoPrimary,
  cork: '00000000-0000-4000-a000-000000000010',
  galway: '00000000-0000-4000-a000-000000000011',
  limerick: '00000000-0000-4000-a000-000000000012',
  kilkenny: '00000000-0000-4000-a000-000000000013',
} as const;

export interface PilotLocation {
  label: string;
  latitude: number;
  longitude: number;
}

export interface PilotUserSeed {
  id: string;
  role: 'SELLER' | 'BUYER';
  email: string;
  displayName: string;
  phone: string;
  location: PilotLocation;
  businessName?: string;
  storeSlug?: string;
}

export interface PilotStoreSeed {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string;
  location: string;
}

export interface PilotListingSeed {
  id: string;
  sellerSlot: number;
  categorySlug: string;
  title: string;
  description: string;
  price: number;
  condition: ListingCondition;
  location: PilotLocation;
  includeNationwideDelivery: boolean;
}

const LOCATIONS = {
  dublin: { label: 'Dublin 14, Ireland', latitude: 53.326, longitude: -6.268 },
  cork: { label: 'Cork City, Ireland', latitude: 51.8985, longitude: -8.4756 },
  galway: { label: 'Galway City, Ireland', latitude: 53.2707, longitude: -9.0568 },
  limerick: { label: 'Limerick City, Ireland', latitude: 52.6638, longitude: -8.6267 },
  kilkenny: { label: 'Kilkenny, Ireland', latitude: 52.6541, longitude: -7.2448 },
  waterford: { label: 'Waterford City, Ireland', latitude: 52.2593, longitude: -7.1101 },
} as const satisfies Record<string, PilotLocation>;

export const PILOT_ADDITIONAL_USERS: PilotUserSeed[] = [
  {
    id: PILOT_SELLER_IDS.cork,
    role: 'SELLER',
    email: 'pilot-seller-cork@community.market',
    displayName: 'Cork Corner Shop',
    phone: '+353871000010',
    location: LOCATIONS.cork,
    businessName: 'Cork Corner Shop',
    storeSlug: 'cork-corner-shop',
  },
  {
    id: PILOT_SELLER_IDS.galway,
    role: 'SELLER',
    email: 'pilot-seller-galway@community.market',
    displayName: 'Galway Home Finds',
    phone: '+353871000011',
    location: LOCATIONS.galway,
    businessName: 'Galway Home Finds',
    storeSlug: 'galway-home-finds',
  },
  {
    id: PILOT_SELLER_IDS.limerick,
    role: 'SELLER',
    email: 'pilot-seller-limerick@community.market',
    displayName: 'Limerick Living',
    phone: '+353871000012',
    location: LOCATIONS.limerick,
    businessName: 'Limerick Living',
    storeSlug: 'limerick-living',
  },
  {
    id: PILOT_SELLER_IDS.kilkenny,
    role: 'SELLER',
    email: 'pilot-seller-kilkenny@community.market',
    displayName: 'Kilkenny Kollective',
    phone: '+353871000013',
    location: LOCATIONS.kilkenny,
    businessName: 'Kilkenny Kollective',
    storeSlug: 'kilkenny-kollective',
  },
  {
    id: PILOT_BUYER_IDS.dublin,
    role: 'BUYER',
    email: 'pilot-buyer-dublin@community.market',
    displayName: 'Pilot Buyer Dublin',
    phone: '+353871000014',
    location: LOCATIONS.dublin,
  },
  {
    id: PILOT_BUYER_IDS.cork,
    role: 'BUYER',
    email: 'pilot-buyer-cork@community.market',
    displayName: 'Pilot Buyer Cork',
    phone: '+353871000015',
    location: LOCATIONS.cork,
  },
  {
    id: PILOT_BUYER_IDS.galway,
    role: 'BUYER',
    email: 'pilot-buyer-galway@community.market',
    displayName: 'Pilot Buyer Galway',
    phone: '+353871000016',
    location: LOCATIONS.galway,
  },
  {
    id: PILOT_BUYER_IDS.waterford,
    role: 'BUYER',
    email: 'pilot-buyer-waterford@community.market',
    displayName: 'Pilot Buyer Waterford',
    phone: '+353871000017',
    location: LOCATIONS.waterford,
  },
];

export const PILOT_STORES: PilotStoreSeed[] = [
  {
    id: PILOT_STORE_IDS.cork,
    userId: PILOT_SELLER_IDS.cork,
    name: 'Cork Corner Shop',
    slug: 'cork-corner-shop',
    description: 'Modest fashion, gifts, and everyday essentials from Cork.',
    location: LOCATIONS.cork.label,
  },
  {
    id: PILOT_STORE_IDS.galway,
    userId: PILOT_SELLER_IDS.galway,
    name: 'Galway Home Finds',
    slug: 'galway-home-finds',
    description: 'Pre-loved furniture and homeware across the west of Ireland.',
    location: LOCATIONS.galway.label,
  },
  {
    id: PILOT_STORE_IDS.limerick,
    userId: PILOT_SELLER_IDS.limerick,
    name: 'Limerick Living',
    slug: 'limerick-living',
    description: 'Electronics, baby gear, and practical household items.',
    location: LOCATIONS.limerick.label,
  },
  {
    id: PILOT_STORE_IDS.kilkenny,
    userId: PILOT_SELLER_IDS.kilkenny,
    name: 'Kilkenny Kollective',
    slug: 'kilkenny-kollective',
    description: 'Sports gear, outdoor equipment, and seasonal bargains.',
    location: LOCATIONS.kilkenny.label,
  },
];

export const SELLER_LOCATIONS: PilotLocation[] = [
  LOCATIONS.dublin,
  LOCATIONS.cork,
  LOCATIONS.galway,
  LOCATIONS.limerick,
  LOCATIONS.kilkenny,
];

/** 60 distinct Unsplash photo paths — combined with listing index for 200 unique URLs. */
const UNIQUE_UNSPLASH_PHOTOS = [
  'photo-1526170375885-4d8ecf77b99f',
  'photo-1505740420928-5e560c06d30e',
  'photo-1523275335684-37898b6baf30',
  'photo-1572569511254-d8f925fe2cbb',
  'photo-1555041469-a586c61e9bc0',
  'photo-1493663284031-b7e3aefcae8e',
  'photo-1586023492125-27b2c045efd7',
  'photo-1567538096630-e0c55bd6374c',
  'photo-1594938298603-c8148c4dae35',
  'photo-1489987707025-afc232f7ea0f',
  'photo-1434389677669-e08b4cac3105',
  'photo-1515372039744-b8f02a3ae446',
  'photo-1517649763962-0c62306601b7',
  'photo-1517836357463-d25dfeac3438',
  'photo-1518611012118-696072aa579a',
  'photo-1476480862126-209bfaa8edc8',
  'photo-1584622650111-993a426fbf0a',
  'photo-1616486338812-3dadae4b4ace',
  'photo-1615529328331-f8917597711f',
  'photo-1615874959474-d609969a20ed',
  'photo-1492144534655-ae79c964c9d7',
  'photo-1503376780353-7e6692767b70',
  'photo-1549317661-bd32c8ce0db2',
  'photo-1552519507-da3b142c6e3d',
  'photo-1454165804606-c3d57bc86b40',
  'photo-1521791136064-7986c2920216',
  'photo-1556761175-5973dc0f32e7',
  'photo-1551836022-d5d88e9218df',
  'photo-1503604475377-5bf86daeff45',
  'photo-1519682337059-a94d519337bc',
  'photo-1485955900006-10f4d324d246',
  'photo-1460353581641-37baddab0fa0',
  'photo-1441986300917-64674bd600d8',
  'photo-1556906781-9a412961c28c',
  'photo-1542291026-7eec264c27ff',
  'photo-1606107557195-0e29a4b5b4aa',
  'photo-1600185365926-3a2ce3cdb9eb',
  'photo-1549298916-b41d501d3772',
  'photo-1560343090-f0409e92791a',
  'photo-1572635196237-14b3f281503f',
  'photo-1622560480605-d83c853a3c0c',
  'photo-1631729371254-42c4f0b765ae',
  'photo-1602810318383-e386cc2a3ae0',
  'photo-1599643478518-a784e5dc4af2',
  'photo-1617032210778-f910bbaf2339',
  'photo-1585386959984-a4155224a1ad',
  'photo-1571171637578-41bc2dd41cd2',
  'photo-1558618666-fcd25c85cd64',
  'photo-1582735689369-4fe89db7114c',
  'photo-1607082349566-187342175e2f',
  'photo-1611312449504-5377a0c5451c',
  'photo-1620799140408-edc6dcb6d633',
  'photo-1631049307264-da0ec9d70304',
  'photo-1593359677879-a7bb80f011ad',
  'photo-1608043152269-423dbba4e7e3',
  'photo-1574944985070-8f3ebc6b79d2',
  'photo-1523275335684-37898b6baf30',
  'photo-1505740420928-5e560c06d30e',
  'photo-1511707171634-5f897ff02aa9',
  'photo-1527814050087-3793815479db',
  'photo-1531297481791-16a38b3a163e',
] as const;

const LISTING_CATALOG: Array<Omit<PilotListingSeed, 'id' | 'sellerSlot' | 'location'>> = [
  {
    categorySlug: 'clothing',
    title: "Women's Abaya Navy",
    description: 'Elegant navy abaya, lightly worn, ideal for everyday wear. Collection in person preferred.',
    price: 99,
    condition: 'good',
    includeNationwideDelivery: true,
  },
  {
    categorySlug: 'clothing',
    title: 'Hijab Gift Set (3 pieces)',
    description: 'Gift set with three premium hijabs. Perfect for Eid or a thoughtful present.',
    price: 35,
    condition: 'new',
    includeNationwideDelivery: true,
  },
  {
    categorySlug: 'electronics',
    title: 'Samsung Galaxy A54',
    description: '128GB, excellent battery life, minor wear on corners. Unlocked to all networks.',
    price: 249,
    condition: 'good',
    includeNationwideDelivery: true,
  },
  {
    categorySlug: 'electronics',
    title: 'Apple AirPods Pro (2nd Gen)',
    description: 'Includes charging case and replacement tips. Fully working with active noise cancellation.',
    price: 165,
    condition: 'like_new',
    includeNationwideDelivery: true,
  },
  {
    categorySlug: 'furniture',
    title: 'Solid Oak Coffee Table',
    description: 'Handmade oak coffee table with storage shelf. Smoke-free home.',
    price: 120,
    condition: 'good',
    includeNationwideDelivery: false,
  },
  {
    categorySlug: 'furniture',
    title: 'IKEA Billy Bookcase (White)',
    description: 'Tall bookcase with adjustable shelves. Disassembled for easy collection.',
    price: 45,
    condition: 'good',
    includeNationwideDelivery: false,
  },
  {
    categorySlug: 'home-garden',
    title: 'Dyson V8 Cordless Vacuum',
    description: 'Fully charged, cleaned filters included. Great for apartments and quick cleans.',
    price: 180,
    condition: 'good',
    includeNationwideDelivery: true,
  },
  {
    categorySlug: 'home-garden',
    title: 'Ceramic Plant Pot Set',
    description: 'Set of three neutral planters for indoor herbs or succulents.',
    price: 28,
    condition: 'like_new',
    includeNationwideDelivery: true,
  },
  {
    categorySlug: 'sports-outdoors',
    title: 'Adult Road Bike (54cm)',
    description: 'Lightweight aluminium frame, recently serviced brakes and gears.',
    price: 320,
    condition: 'good',
    includeNationwideDelivery: false,
  },
  {
    categorySlug: 'sports-outdoors',
    title: 'Yoga Mat and Block Bundle',
    description: 'Non-slip mat with cork block. Barely used after home gym upgrade.',
    price: 22,
    condition: 'like_new',
    includeNationwideDelivery: true,
  },
];

function pilotListingId(index: number): string {
  return `00000000-0000-4000-a000-${String(100 + index).padStart(12, '0')}`;
}

function pilotImageId(listingIndex: number, sortOrder: number): string {
  const base = 2000 + listingIndex * 10 + sortOrder;
  return `00000000-0000-4000-a000-${String(base).padStart(12, '0')}`;
}

export function buildUniquePilotImageUrl(listingId: string, listingIndex: number, sortOrder: number): string {
  const globalIndex = listingIndex * 4 + sortOrder;
  const photo = UNIQUE_UNSPLASH_PHOTOS[globalIndex % UNIQUE_UNSPLASH_PHOTOS.length]!;
  const crop = (globalIndex % 5) + 1;
  return `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=900&h=900&q=80&crop=entropy&cs=tinysrgb&sig=${listingId.slice(-8)}-${sortOrder}-${crop}`;
}

export function buildPilotListings(): PilotListingSeed[] {
  const listings: PilotListingSeed[] = [];

  for (let index = 0; index < 50; index += 1) {
    const template = LISTING_CATALOG[index % LISTING_CATALOG.length]!;
    const sellerSlot = index % SELLER_LOCATIONS.length;
    const location = SELLER_LOCATIONS[sellerSlot]!;
    const variant = Math.floor(index / LISTING_CATALOG.length) + 1;

    listings.push({
      id: pilotListingId(index),
      sellerSlot,
      location,
      categorySlug: template.categorySlug,
      title: `[Pilot] ${template.title}${variant > 1 ? ` #${variant}` : ''}`,
      description: `${template.description} Pilot sample listing for marketplace testing.`,
      price: template.price + (variant - 1) * 5,
      condition: template.condition,
      includeNationwideDelivery: template.includeNationwideDelivery,
    });
  }

  return listings;
}

export function getPilotListingImages(
  listing: PilotListingSeed,
  listingIndex: number,
): Array<{ id: string; url: string; sortOrder: number }> {
  return Array.from({ length: 4 }, (_, sortOrder) => ({
    id: pilotImageId(listingIndex, sortOrder),
    url: buildUniquePilotImageUrl(listing.id, listingIndex, sortOrder),
    sortOrder,
  }));
}

export function categoryIdFromMap(slug: string, categoryBySlug: Map<string, string>): string {
  const categoryId = categoryBySlug.get(slug);
  if (!categoryId) {
    throw new Error(`Category slug not found in database: ${slug}`);
  }
  return categoryId;
}

/** @deprecated Use categoryIdFromMap with a DB lookup on production. */
export function categoryIdForSlug(slug: string): string {
  const row = DEV_CATEGORY_SEED.find((entry) => entry.slug === slug);
  if (!row) {
    throw new Error(`Unknown category slug: ${slug}`);
  }
  return row.id;
}

export const PILOT_LISTINGS = buildPilotListings();

export const PILOT_TARGET_SELLERS = 5;
export const PILOT_TARGET_BUYERS = 5;

export const PILOT_SUMMARY = {
  sellers: PILOT_TARGET_SELLERS,
  buyers: PILOT_TARGET_BUYERS,
  listings: PILOT_LISTINGS.length,
  imagesPerListing: 4,
} as const;

export function pilotFillerSellers(): PilotUserSeed[] {
  return PILOT_ADDITIONAL_USERS.filter((user) => user.role === 'SELLER');
}

export function pilotFillerBuyers(): PilotUserSeed[] {
  return PILOT_ADDITIONAL_USERS.filter((user) => user.role === 'BUYER');
}
