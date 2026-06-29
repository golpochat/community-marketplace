import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, SellerStatus } from '@prisma/client';

import type { ListingSummary, SellerStorefront } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import {
  listingInclude,
  mapListingSummaryWithTrust,
  type ListingWithRelations,
} from '../mappers/listing.mapper';
import {
  buildStoreSlug,
  getStoreDisplayName,
  isStoreSlugUuid,
  slugifyStoreName,
} from '../utils/store-slug.util';
import {
  buildStoreContact,
  readPrivacySettings,
  readStorePrefs,
  resolveStoreOpeningHours,
} from '../utils/store-contact.util';
import { buildCategoryStoreSections } from '../utils/store-sections.util';
import { ListingVisibilityService } from './listing-visibility.service';
import { SellerTrustService } from './seller-trust.service';

type StoreSort = 'newest' | 'price_low_to_high' | 'price_high_to_low';

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: ListingVisibilityService,
    private readonly sellerTrust: SellerTrustService,
  ) {}

  async getBySlug(slug: string): Promise<SellerStorefront> {
    const seller = await this.resolveSeller(slug);
    if (!seller) {
      throw new NotFoundException('Store not found');
    }

    if (seller.sellerStatus === 'suspended') {
      return this.buildUnavailableStorefront(seller, slug);
    }

    const prefs = readStorePrefs(seller.settings?.communicationPreferences);
    const privacy = readPrivacySettings(seller.settings?.privacySettings);
    const storeSlug = buildStoreSlug({
      id: seller.id,
      displayName: seller.displayName,
      businessName: seller.profile?.businessName,
      preferredSlug: prefs.storeSlug,
    });
    const trust = await this.sellerTrust.getProfile(seller.id);
    const listings = await this.fetchSellerListings(seller.id, 'newest', 1, 48);
    const sections = await this.fetchCategorySections(seller.id);

    const verified = seller.sellerStatus === 'verified' || seller.idVerified;
    const locationLabel = seller.profile?.location ?? undefined;
    const logoUrl =
      seller.profile?.businessLogoUrl ?? seller.avatarUrl ?? undefined;
    const bannerUrl = seller.profile?.storeBannerUrl ?? undefined;
    const contact = buildStoreContact({
      email: seller.email,
      phone: seller.profile?.phone,
      address: seller.profile?.address,
      location: seller.profile?.location,
      website: seller.profile?.businessWebsite,
      isBusinessAccount: seller.profile?.isBusinessAccount,
      privacy,
      prefs,
    });
    const openingHours = resolveStoreOpeningHours(prefs);

    return {
      id: seller.id,
      sellerId: seller.id,
      slug: storeSlug,
      name: getStoreDisplayName(seller),
      description: seller.profile?.bio?.trim() || 'No store description yet.',
      logoUrl,
      bannerUrl,
      location: locationLabel,
      memberSince: seller.createdAt.toISOString(),
      verified,
      sellerStatus: seller.sellerStatus as SellerStorefront['sellerStatus'],
      available: true,
      contactListingId: listings.data[0]?.id,
      contact,
      openingHours,
      policies: {
        returns: prefs.storePolicies?.returns,
        shipping: prefs.storePolicies?.shipping,
        responseTime:
          prefs.storePolicies?.responseTime ??
          (trust.responseTimeMinutes
            ? `Typically responds within ${trust.responseTimeMinutes} minutes`
            : undefined),
      },
      analytics: {
        totalViews: listings.data.reduce((sum, row) => sum + (row.viewCount ?? 0), 0),
        totalSales: trust.soldCount ?? 0,
        averageRating: trust.averageRating ?? 0,
        reviewCount: trust.reviewCount ?? 0,
      },
      sections,
      listings: listings.data,
      reviews: [],
    };
  }

  async getListings(
    slug: string,
    sort: StoreSort = 'newest',
    page = 1,
    limit = 24,
  ) {
    const seller = await this.resolveSeller(slug);
    if (!seller) {
      throw new NotFoundException('Store not found');
    }
    if (seller.sellerStatus === 'suspended') {
      return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
    }
    return this.fetchSellerListings(seller.id, sort, page, limit);
  }

  private async fetchCategorySections(sellerId: string) {
    const rows = await this.prisma.listing.findMany({
      where: this.visibility.visibleListingWhere({
        sellerId,
        seller: {
          status: 'active',
          sellerStatus: { not: 'suspended' },
        },
      }),
      select: {
        id: true,
        categoryId: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { activatedAt: 'desc' },
    });

    return buildCategoryStoreSections(rows);
  }

  private async fetchSellerListings(
    sellerId: string,
    sort: StoreSort,
    page: number,
    limit: number,
  ) {
    const where = this.visibility.visibleListingWhere({
      sellerId,
      seller: {
        status: 'active',
        sellerStatus: { not: 'suspended' },
      },
    });

    const orderBy: Prisma.ListingOrderByWithRelationInput =
      sort === 'price_low_to_high'
        ? { price: 'asc' }
        : sort === 'price_high_to_low'
          ? { price: 'desc' }
          : { activatedAt: 'desc' };

    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    const trustMap = await this.sellerTrust.getSummariesForSellers([sellerId]);
    const trust = trustMap.get(sellerId);

    const data = rows.map((row) => ({
      ...mapListingSummaryWithTrust(row as ListingWithRelations, undefined, trust),
      viewCount: row.viewCount,
    }));

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  private async resolveSeller(slug: string) {
    if (isStoreSlugUuid(slug)) {
      return this.prisma.user.findFirst({
        where: { id: slug, primaryRole: { code: 'SELLER' } },
        include: {
          profile: true,
          settings: true,
          primaryRole: true,
        },
      });
    }

    const normalized = slugifyStoreName(slug);
    const sellers = await this.prisma.user.findMany({
      where: { primaryRole: { code: 'SELLER' } },
      include: {
        profile: true,
        settings: true,
        primaryRole: true,
      },
      take: 500,
      orderBy: { createdAt: 'asc' },
    });

    return (
      sellers.find((seller) => {
        const prefs = readStorePrefs(seller.settings?.communicationPreferences);
        const candidate = buildStoreSlug({
          id: seller.id,
          displayName: seller.displayName,
          businessName: seller.profile?.businessName,
          preferredSlug: prefs.storeSlug,
        });
        return candidate === normalized || slugifyStoreName(getStoreDisplayName(seller)) === normalized;
      }) ?? null
    );
  }

  private buildUnavailableStorefront(
    seller: {
      id: string;
      displayName: string | null;
      email: string;
      sellerStatus: SellerStatus;
      profile: { businessName: string | null } | null;
    },
    slug: string,
  ): SellerStorefront {
    return {
      id: seller.id,
      sellerId: seller.id,
      slug,
      name: getStoreDisplayName(seller),
      description: '',
      memberSince: '',
      verified: false,
      sellerStatus: 'suspended',
      available: false,
      unavailableMessage: 'This seller is currently unavailable.',
      policies: {},
      analytics: {
        totalViews: 0,
        totalSales: 0,
        averageRating: 0,
        reviewCount: 0,
      },
      sections: [],
      listings: [],
      reviews: [],
    };
  }
}
