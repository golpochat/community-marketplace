import type { Prisma } from "@prisma/client";

import type {
  Category,
  Listing,
  ListingImage,
  ListingSummary,
  ListingVehicleAttributes,
} from "@community-marketplace/types";
import {
  buildDeliverySummaryLabel,
  buildListingImageVariantUrls,
  formatLocationLabel,
} from "@community-marketplace/utils";

import { resolveAssetPublicUrl } from "../../../libs/asset-url.lib";
import { isListingBoosted } from "../../monetization/lib/boost.lib";
import { isListingFeatured } from "../../monetization/lib/featured.lib";
import { readStorePrefs, resolvePublicStoreContact } from "../utils/store-contact.util";
import { buildStoreSlug } from "../utils/store-slug.util";
import {
  listingDeliveryInclude,
  mapListingDeliverySelection,
} from "./delivery.mapper";

export const listingInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  deliveryOptions: {
    include: listingDeliveryInclude,
    orderBy: { createdAt: "asc" as const },
  },
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      location: true,
      contactSettings: true,
    },
  },
  seller: {
    include: {
      primaryRole: true,
      profile: true,
      settings: { select: { communicationPreferences: true, privacySettings: true } },
      verifications: {
        where: { badgeGranted: true, status: "approved" as const },
        take: 1,
      },
      _count: {
        select: {
          listings: { where: { status: "active" as const } },
        },
      },
    },
  },
} satisfies Prisma.ListingInclude;

export type ListingWithRelations = Prisma.ListingGetPayload<{
  include: typeof listingInclude;
}>;

function parseListingAttributes(value: unknown): ListingVehicleAttributes | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as ListingVehicleAttributes;
}

function buildImageVariantUrls(url: string) {
  return buildListingImageVariantUrls(resolveAssetPublicUrl(url));
}

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
  const variants = buildImageVariantUrls(row.url);
  return {
    id: row.id,
    listingId: row.listingId,
    url: variants.url,
    cardUrl: variants.cardUrl,
    thumbUrl: variants.thumbUrl,
    tinyUrl: variants.tinyUrl,
    order: row.sortOrder,
  };
}

export function mapListing(
  row: ListingWithRelations,
  extras?: { priceDroppedAt?: string },
): Listing {
  const deliveryOptions =
    row.deliveryOptions?.length > 0
      ? row.deliveryOptions.map(mapListingDeliverySelection)
      : undefined;

  return {
    id: row.id,
    sellerId: row.sellerId,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    originalPrice:
      row.originalPrice != null ? Number(row.originalPrice) : undefined,
    salePrice: row.salePrice != null ? Number(row.salePrice) : undefined,
    discountPercent: row.discountPercent ?? undefined,
    priceDroppedAt: extras?.priceDroppedAt,
    currency: row.currency,
    categoryId: row.categoryId,
    category: mapCategory(row.category),
    condition: row.condition,
    status: row.status,
    location: {
      label: formatLocationLabel(row.locationLabel),
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    },
    images: row.images.map(mapListingImage),
    attributes: parseListingAttributes(row.attributes),
    deliveryOptions,
    viewCount: row.viewCount,
    favoriteCount: row.favoriteCount,
    moderationNotes: row.moderationNotes ?? undefined,
    bannedAt: row.bannedAt?.toISOString(),
    isPaid: row.isPaid,
    packageType: row.packageType,
    boostedUntil: row.boostedUntil?.toISOString(),
    isBoosted: isListingBoosted(row.boostedUntil),
    featuredUntil: row.featuredUntil?.toISOString(),
    isFeatured: isListingFeatured(row),
    featuredPlacement:
      (row.featuredPlacement as Listing["featuredPlacement"]) ?? undefined,
    activatedAt: row.activatedAt?.toISOString(),
    expiresAt: row.expiresAt?.toISOString(),
    endedAt: row.endedAt?.toISOString(),
    rejectionReason: row.rejectionReason ?? undefined,
    removalReason: row.removalReason ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    seller: mapListingSeller(row.seller, row.store),
  };
}

export interface SellerTrustData {
  averageRating?: number;
  reviewCount: number;
  soldCount: number;
  responseRate?: number;
  responseTimeMinutes?: number;
}

export function mapListingWithTrust(
  row: ListingWithRelations,
  extras?: { priceDroppedAt?: string; trust?: SellerTrustData },
): Listing {
  const listing = mapListing(row, { priceDroppedAt: extras?.priceDroppedAt });
  if (listing.seller && extras?.trust) {
    listing.seller = mapListingSeller(row.seller, row.store, extras.trust);
  }
  return listing;
}

export function mapListingSummaryWithTrust(
  row: ListingWithRelations,
  distanceKm?: number,
  trust?: SellerTrustData,
): ListingSummary {
  const summary = mapListingSummary(row, distanceKm);
  if (!trust) return summary;
  return {
    ...summary,
    sellerRating: trust.averageRating,
    sellerReviewCount: trust.reviewCount,
    sellerSoldCount: trust.soldCount,
  };
}

function isSellerVerified(seller: ListingWithRelations['seller']): boolean {
  if (!seller) return false;
  return (
    seller.sellerStatus === 'verified' ||
    seller.idVerified ||
    seller.verifications.length > 0
  );
}

function resolveSellerStoreSlug(
  seller: ListingWithRelations["seller"],
): string | undefined {
  if (!seller) return undefined;
  const prefs = readStorePrefs(seller.settings?.communicationPreferences);
  return buildStoreSlug({
    id: seller.id,
    displayName: seller.displayName,
    businessName: seller.profile?.businessName,
    preferredSlug: prefs.storeSlug,
  });
}

function mapListingSeller(
  seller: ListingWithRelations["seller"],
  store: ListingWithRelations["store"] | null | undefined,
  trust?: SellerTrustData,
): Listing["seller"] {
  if (!seller) return undefined;

  const publicContact =
    store &&
    resolvePublicStoreContact({
      store: {
        location: store.location,
        contactSettings: store.contactSettings,
      },
      seller: {
        email: seller.email,
        profile: seller.profile,
        settings: seller.settings,
      },
    });

  const storeName = store?.name?.trim();
  const displayName = storeName || seller.displayName?.trim() || undefined;
  const storeSlug = store?.slug?.trim() || resolveSellerStoreSlug(seller);

  return {
    id: seller.id,
    displayName,
    email: seller.email,
    verified: isSellerVerified(seller),
    phoneVerified: Boolean(seller.phoneVerifiedAt),
    memberSince: seller.createdAt.toISOString(),
    activeListingCount: seller._count?.listings,
    soldCount: trust?.soldCount,
    averageRating: trust?.averageRating,
    reviewCount: trust?.reviewCount,
    responseRate: trust?.responseRate,
    responseTimeMinutes: trust?.responseTimeMinutes,
    isAmbassador: seller.profile?.isCommunityAmbassador ?? false,
    isBusiness: seller.profile?.isBusinessAccount ?? false,
    phone: publicContact?.phone,
    storeSlug,
  };
}

export function mapListingSummary(
  row: ListingWithRelations,
  distanceKm?: number,
): ListingSummary {
  const deliveryOptions =
    row.deliveryOptions?.length > 0
      ? row.deliveryOptions.map(mapListingDeliverySelection)
      : [];

  const cover = row.images[0];
  const coverVariants = cover ? buildImageVariantUrls(cover.url) : undefined;

  return {
    id: row.id,
    title: row.title,
    price: Number(row.price),
    originalPrice:
      row.originalPrice != null ? Number(row.originalPrice) : undefined,
    salePrice: row.salePrice != null ? Number(row.salePrice) : undefined,
    discountPercent: row.discountPercent ?? undefined,
    currency: row.currency,
    location: {
      label: formatLocationLabel(row.locationLabel),
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    },
    status: row.status,
    condition: row.condition,
    categoryId: row.categoryId,
    categorySlug: row.category?.slug,
    imageUrl: coverVariants?.cardUrl ?? coverVariants?.url,
    distanceKm,
    favoriteCount: row.favoriteCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    boostedUntil: row.boostedUntil?.toISOString(),
    isBoosted: isListingBoosted(row.boostedUntil),
    featuredUntil: row.featuredUntil?.toISOString(),
    isFeatured: isListingFeatured(row),
    featuredPlacement:
      (row.featuredPlacement as ListingSummary["featuredPlacement"]) ?? undefined,
    activatedAt: row.activatedAt?.toISOString(),
    deliverySummary: buildDeliverySummaryLabel(deliveryOptions),
    sellerVerified: isSellerVerified(row.seller),
    sellerBusiness: row.seller.profile?.isBusinessAccount ?? false,
    attributes: parseListingAttributes(row.attributes),
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

export function toMeiliDocument(
  row: ListingWithRelations,
  embedding?: number[],
) {
  return {
    id: row.id,
    sellerId: row.sellerId,
    sellerName: row.seller.displayName ?? undefined,
    sellerVerified: isSellerVerified(row.seller),
    title: row.title,
    description: row.description,
    price: Number(row.price),
    currency: row.currency,
    categoryId: row.categoryId,
    categorySlug: row.category.slug,
    categoryName: row.category.name,
    condition: row.condition,
    status: row.status,
    locationLabel: formatLocationLabel(row.locationLabel),
    _geo: {
      lat: Number(row.latitude),
      lng: Number(row.longitude),
    },
    imageUrl: row.images[0]
      ? buildListingImageVariantUrls(resolveAssetPublicUrl(row.images[0].url)).cardUrl ??
        resolveAssetPublicUrl(row.images[0].url)
      : undefined,
    favoriteCount: row.favoriteCount,
    viewCount: row.viewCount,
    createdAt: row.createdAt.getTime(),
    boostedUntil: row.boostedUntil?.getTime() ?? 0,
    isBoosted: isListingBoosted(row.boostedUntil),
    featuredUntil: row.featuredUntil?.getTime() ?? 0,
    isFeatured: isListingFeatured(row),
    featuredPlacement: row.featuredPlacement ?? undefined,
    sellerStatus: row.seller.status,
    ...(embedding ? { embedding } : {}),
  };
}
