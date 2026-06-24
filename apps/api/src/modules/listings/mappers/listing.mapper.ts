import type { Prisma } from '@prisma/client';

import type {
  Category,
  Listing,
  ListingImage,
  ListingSummary,
} from '@community-marketplace/types';

export const listingInclude = {
  category: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
  seller: {
    include: {
      primaryRole: true,
      verifications: { where: { badgeGranted: true, status: 'approved' as const }, take: 1 },
    },
  },
} satisfies Prisma.ListingInclude;

export type ListingWithRelations = Prisma.ListingGetPayload<{
  include: typeof listingInclude;
}>;

export function mapCategory(row: {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon ?? undefined,
    description: row.description ?? undefined,
    parentId: row.parentId ?? undefined,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapListingImage(row: {
  id: string;
  listingId: string;
  url: string;
  sortOrder: number;
}): ListingImage {
  return {
    id: row.id,
    listingId: row.listingId,
    url: row.url,
    order: row.sortOrder,
  };
}

export function mapListing(row: ListingWithRelations): Listing {
  return {
    id: row.id,
    sellerId: row.sellerId,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    currency: row.currency,
    categoryId: row.categoryId,
    category: mapCategory(row.category),
    condition: row.condition,
    status: row.status,
    location: {
      label: row.locationLabel,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    },
    images: row.images.map(mapListingImage),
    viewCount: row.viewCount,
    favoriteCount: row.favoriteCount,
    moderationNotes: row.moderationNotes ?? undefined,
    bannedAt: row.bannedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapListingSummary(
  row: ListingWithRelations,
  distanceKm?: number,
): ListingSummary {
  return {
    id: row.id,
    title: row.title,
    price: Number(row.price),
    currency: row.currency,
    location: {
      label: row.locationLabel,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    },
    status: row.status,
    condition: row.condition,
    categoryId: row.categoryId,
    imageUrl: row.images[0]?.url,
    distanceKm,
    favoriteCount: row.favoriteCount,
    createdAt: row.createdAt.toISOString(),
  };
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function toMeiliDocument(row: ListingWithRelations, embedding?: number[]) {
  return {
    id: row.id,
    sellerId: row.sellerId,
    sellerName: row.seller.displayName ?? undefined,
    sellerVerified: row.seller.verifications.length > 0,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    currency: row.currency,
    categoryId: row.categoryId,
    categorySlug: row.category.slug,
    categoryName: row.category.name,
    condition: row.condition,
    status: row.status,
    locationLabel: row.locationLabel,
    _geo: {
      lat: Number(row.latitude),
      lng: Number(row.longitude),
    },
    imageUrl: row.images[0]?.url,
    favoriteCount: row.favoriteCount,
    viewCount: row.viewCount,
    createdAt: row.createdAt.getTime(),
    sellerStatus: row.seller.status,
    ...(embedding ? { embedding } : {}),
  };
}
