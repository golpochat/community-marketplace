import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  FeaturedCatalogResponse,
  FeaturedPlacement,
  MonetizationSettings,
} from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import {
  FEATURED_DURATION_HOURS,
  buildActiveFeaturedWhere,
  featuredSkuKey,
  isListingFeatured,
  slotsPerDayForPlacement,
} from '../lib/featured.lib';
import { PlatformSettingsService } from './platform-settings.service';

const FEATURED_LABELS: Record<FeaturedPlacement, string> = {
  homepage: 'Homepage featured',
  category: 'Category featured',
};

@Injectable()
export class FeaturedCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: PlatformSettingsService,
  ) {}

  async getCatalog(
    sellerId: string,
    listingId?: string,
    categoryId?: string,
  ): Promise<FeaturedCatalogResponse> {
    const settings = await this.settings.get();
    const listing = listingId
      ? await this.prisma.listing.findUnique({ where: { id: listingId } })
      : null;

    if (listingId && !listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing && listing.sellerId !== sellerId) {
      throw new ForbiddenException('You can only feature your own listings');
    }

    const resolvedCategoryId = categoryId ?? listing?.categoryId;
    const now = new Date();

    const options = await Promise.all(
      (['homepage', 'category'] as const).map(async (placement) => {
        const skuKey = featuredSkuKey(placement);
        const sku = settings.pricing.skus[skuKey];
        const slotsPerDay = slotsPerDayForPlacement(
          placement,
          settings.pricing.featured ?? {},
        );
        const slotsUsed = await this.prisma.listing.count({
          where: buildActiveFeaturedWhere(
            placement,
            now,
            placement === 'category' ? resolvedCategoryId : undefined,
          ),
        });
        const slotsRemaining = Math.max(0, slotsPerDay - slotsUsed);
        const { eligible, reason } = this.evaluateEligibility(
          settings,
          listing,
          placement,
          sku?.enabled ?? false,
          slotsRemaining,
          resolvedCategoryId,
        );

        return {
          placement,
          label: FEATURED_LABELS[placement],
          price: sku?.amount ?? 0,
          durationHours: FEATURED_DURATION_HOURS,
          slotsPerDay,
          slotsUsed,
          slotsRemaining,
          eligible,
          reason,
        };
      }),
    );

    return {
      featuredEnabled: settings.featuredEnabled,
      currency: settings.pricing.currency,
      options,
      listing: listing
        ? {
            id: listing.id,
            status: listing.status,
            categoryId: listing.categoryId,
            isFeatured: isListingFeatured(listing),
            featuredUntil: listing.featuredUntil?.toISOString(),
            featuredPlacement:
              (listing.featuredPlacement as FeaturedPlacement | null) ?? undefined,
          }
        : undefined,
    };
  }

  private evaluateEligibility(
    settings: MonetizationSettings,
    listing: { status: string; categoryId: string } | null,
    placement: FeaturedPlacement,
    skuEnabled: boolean,
    slotsRemaining: number,
    categoryId?: string,
  ): { eligible: boolean; reason?: string } {
    if (!settings.featuredEnabled) {
      return { eligible: false, reason: 'featured_disabled' };
    }
    if (!skuEnabled) {
      return { eligible: false, reason: 'featured_disabled' };
    }
    if (slotsRemaining <= 0) {
      return { eligible: false, reason: 'slots_full' };
    }
    if (placement === 'category' && !categoryId) {
      return { eligible: false, reason: 'category_required' };
    }
    if (!listing) {
      return { eligible: true };
    }
    if (listing.status !== 'active' && listing.status !== 'paused') {
      return { eligible: false, reason: 'listing_not_active' };
    }
    if (placement === 'category' && listing.categoryId !== categoryId) {
      return { eligible: false, reason: 'category_mismatch' };
    }
    return { eligible: true };
  }
}
