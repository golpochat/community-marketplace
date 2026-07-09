import type { Prisma } from '@prisma/client';

import type {
  CategorySearchDocument,
  ChatThreadSearchDocument,
  ListingSearchDocument,
  UserSearchDocument,
} from '@community-marketplace/types';

import { buildListingImageVariantUrls } from '@community-marketplace/utils';

import { resolveAssetPublicUrl, resolveOptionalAssetPublicUrl } from '../../../libs/asset-url.lib';

function isBoosted(boostedUntil?: Date | null, now = new Date()): boolean {
  return boostedUntil != null && boostedUntil > now;
}

type ListingRow = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: Prisma.Decimal;
  currency: string;
  categoryId: string;
  condition: string;
  status: string;
  locationLabel: string;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  favoriteCount: number;
  viewCount: number;
  boostedUntil?: Date | null;
  createdAt: Date;
  images: Array<{ url: string }>;
  category: { slug: string; name: string };
  seller: {
    status: string;
    displayName: string | null;
    avatarUrl: string | null;
    verifications?: Array<{ badgeGranted: boolean; status: string }>;
  };
};

export function toMeiliListingDocument(row: ListingRow, embedding?: number[]): ListingSearchDocument {
  const sellerVerified = row.seller.verifications?.some(
    (v) => v.badgeGranted && v.status === 'approved',
  );
  return {
    id: row.id,
    sellerId: row.sellerId,
    sellerName: row.seller.displayName ?? undefined,
    sellerVerified: sellerVerified ?? false,
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
    _geo: { lat: Number(row.latitude), lng: Number(row.longitude) },
    imageUrl: row.images[0]?.url
      ? buildListingImageVariantUrls(resolveAssetPublicUrl(row.images[0].url)).cardUrl ??
        resolveAssetPublicUrl(row.images[0].url)
      : undefined,
    favoriteCount: row.favoriteCount,
    viewCount: row.viewCount,
    createdAt: row.createdAt.getTime(),
    boostedUntil: row.boostedUntil?.getTime() ?? 0,
    isBoosted: isBoosted(row.boostedUntil),
    sellerStatus: row.seller.status,
    ...(embedding ? { embedding } : {}),
  };
}

export function toMeiliUserDocument(row: {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: string;
  primaryRole: { code: string };
  verifications?: Array<{ badgeGranted: boolean; status: string }>;
}): UserSearchDocument {
  return {
    id: row.id,
    displayName: row.displayName ?? 'User',
    avatarUrl: resolveOptionalAssetPublicUrl(row.avatarUrl),
    sellerVerified:
      row.verifications?.some((v) => v.badgeGranted && v.status === 'approved') ?? false,
    role: row.primaryRole.code,
    status: row.status,
  };
}

export function toMeiliCategoryDocument(row: {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
  parent?: { slug: string } | null;
}): CategorySearchDocument {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parentId ?? undefined,
    parentSlug: row.parent?.slug,
    isActive: row.isActive,
  };
}

export function toMeiliChatThreadDocument(row: {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  listing: { title: string };
}): ChatThreadSearchDocument {
  return {
    id: row.id,
    listingId: row.listingId,
    listingTitle: row.listing.title,
    buyerId: row.buyerId,
    sellerId: row.sellerId,
  };
}
