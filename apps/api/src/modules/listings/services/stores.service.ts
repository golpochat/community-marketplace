import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, SellerStatus } from '@prisma/client';

import type { ListingSummary, SellerStorefront } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { resolveOptionalAssetPublicUrl } from '../../../libs/asset-url.lib';
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
  readStorePrefs,
  resolvePublicStoreContact,
  resolveStoreOpeningHoursFromRow,
  resolveStorePoliciesFromRow,
} from '../utils/store-contact.util';
import { buildCategoryStoreSections } from '../utils/store-sections.util';
import { ListingVisibilityService } from './listing-visibility.service';
import { SellerTrustService } from './seller-trust.service';

type StoreSort = 'newest' | 'price_low_to_high' | 'price_high_to_low';

type StoreContext = {
  store: {
    id: string;
    userId: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    location: string | null;
    contactSettings: unknown;
    openingHours: unknown;
    policies: unknown;
  };
  seller: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    sellerStatus: SellerStatus;
    idVerified: boolean;
    createdAt: Date;
    profile: {
      businessName: string | null;
      businessLogoUrl: string | null;
      storeBannerUrl: string | null;
      location: string | null;
      bio: string | null;
      phone: string | null;
      address: string | null;
      businessWebsite: string | null;
      isBusinessAccount: boolean;
    } | null;
    settings: { communicationPreferences: unknown; privacySettings: unknown } | null;
  };
};

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: ListingVisibilityService,
    private readonly sellerTrust: SellerTrustService,
  ) {}

  async getBySlug(slug: string): Promise<SellerStorefront> {
    const context = await this.resolveStoreContext(slug);
    if (!context) {
      throw new NotFoundException('Store not found');
    }

    const { store, seller } = context;

    if (seller.sellerStatus === 'suspended') {
      return this.buildUnavailableStorefront(store, seller);
    }

    const prefs = readStorePrefs(seller.settings?.communicationPreferences);
    const trust = await this.sellerTrust.getProfile(seller.id);
    const listings = await this.fetchStoreListings(store.id, seller.id, 'newest', 1, 48);
    const sections = await this.fetchCategorySections(store.id, seller.id);

    const verified = seller.sellerStatus === 'verified' || seller.idVerified;
    const logoUrl = resolveOptionalAssetPublicUrl(store.logoUrl);
    const bannerUrl = resolveOptionalAssetPublicUrl(store.bannerUrl);

    const contact = resolvePublicStoreContact({
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

    const openingHours = resolveStoreOpeningHoursFromRow(store.openingHours, prefs);
    const responseTimeFallback = trust.responseTimeMinutes
      ? `Typically responds within ${trust.responseTimeMinutes} minutes`
      : undefined;
    const policies = resolveStorePoliciesFromRow(
      store.policies,
      prefs,
      responseTimeFallback,
    );

    return {
      id: store.id,
      sellerId: seller.id,
      slug: store.slug,
      name: store.name,
      description: store.description?.trim() || 'No store description yet.',
      logoUrl,
      bannerUrl,
      location: store.location ?? undefined,
      memberSince: seller.createdAt.toISOString(),
      verified,
      sellerStatus: seller.sellerStatus as SellerStorefront['sellerStatus'],
      available: true,
      contactListingId: listings.data[0]?.id,
      contact,
      openingHours,
      policies,
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
    const context = await this.resolveStoreContext(slug);
    if (!context) {
      throw new NotFoundException('Store not found');
    }
    if (context.seller.sellerStatus === 'suspended') {
      return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
    }
    return this.fetchStoreListings(context.store.id, context.seller.id, sort, page, limit);
  }

  private async fetchCategorySections(storeId: string, sellerId: string) {
    const rows = await this.prisma.listing.findMany({
      where: this.visibility.visibleListingWhere({
        storeId,
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

  private async fetchStoreListings(
    storeId: string,
    sellerId: string,
    sort: StoreSort,
    page: number,
    limit: number,
  ) {
    const where = this.visibility.visibleListingWhere({
      storeId,
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

  private async resolveStoreContext(slug: string): Promise<StoreContext | null> {
    const sellerInclude = {
      profile: true,
      settings: true,
      primaryRole: true,
    } as const;

    if (isStoreSlugUuid(slug)) {
      const byStoreId = await this.prisma.store.findFirst({
        where: { id: slug },
        include: { user: { include: sellerInclude } },
      });
      if (byStoreId?.user.primaryRole.code === 'SELLER') {
        return { store: byStoreId, seller: byStoreId.user };
      }

      const seller = await this.prisma.user.findFirst({
        where: { id: slug, primaryRole: { code: 'SELLER' } },
        include: sellerInclude,
      });
      if (!seller) return null;
      const store = await this.prisma.store.findFirst({
        where: { userId: seller.id, isPrimary: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!store) return null;
      return { store, seller };
    }

    const normalized = slugifyStoreName(slug);
    const store = await this.prisma.store.findFirst({
      where: {
        OR: [{ slug: normalized }, { slug }],
      },
      include: { user: { include: sellerInclude } },
    });
    if (store?.user.primaryRole.code === 'SELLER') {
      return { store, seller: store.user };
    }

    return this.resolveLegacyStoreContext(normalized, sellerInclude);
  }

  private async resolveLegacyStoreContext(
    normalized: string,
    sellerInclude: {
      profile: true;
      settings: true;
      primaryRole: true;
    },
  ): Promise<StoreContext | null> {
    const sellers = await this.prisma.user.findMany({
      where: { primaryRole: { code: 'SELLER' } },
      include: sellerInclude,
      take: 500,
      orderBy: { createdAt: 'asc' },
    });

    const seller = sellers.find((row) => {
      const prefs = readStorePrefs(row.settings?.communicationPreferences);
      const candidate = buildStoreSlug({
        id: row.id,
        displayName: row.displayName,
        businessName: row.profile?.businessName,
        preferredSlug: prefs.storeSlug,
      });
      return candidate === normalized || slugifyStoreName(getStoreDisplayName(row)) === normalized;
    });

    if (!seller) return null;

    const store =
      (await this.prisma.store.findFirst({
        where: { userId: seller.id, isPrimary: true },
        orderBy: { createdAt: 'asc' },
      })) ??
      (await this.prisma.store.findFirst({
        where: { userId: seller.id },
        orderBy: { createdAt: 'asc' },
      }));

    if (!store) return null;
    return { store, seller };
  }

  private buildUnavailableStorefront(
    store: StoreContext['store'],
    seller: StoreContext['seller'],
  ): SellerStorefront {
    return {
      id: store.id,
      sellerId: seller.id,
      slug: store.slug,
      name: store.name,
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
