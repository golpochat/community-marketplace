import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { FeaturedStoreCatalogResponse } from '@community-marketplace/types';
import {
  isSellerVerified,
  SELLER_VERIFICATION_MESSAGES,
} from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import {
  FEATURED_DURATION_HOURS,
  buildActiveFeaturedStoreWhere,
  isStoreFeatured,
  storeHomepageSlotsPerDay,
} from '../lib/featured.lib';
import { AdsSystemService } from './ads-system.service';
import { PlatformSettingsService } from './platform-settings.service';

@Injectable()
export class FeaturedStoreCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: PlatformSettingsService,
    private readonly adsSystem: AdsSystemService,
  ) {}

  async getCatalog(
    sellerId: string,
    storeId: string,
  ): Promise<FeaturedStoreCatalogResponse> {
    const settings = await this.settings.get();
    const featuredEnabled =
      settings.featuredEnabled && (await this.adsSystem.isFeaturedSlotsEffective());
    const seller = await this.prisma.user.findUniqueOrThrow({
      where: { id: sellerId },
      select: { sellerStatus: true },
    });
    const sellerVerified = isSellerVerified(seller.sellerStatus);

    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    if (store.userId !== sellerId) {
      throw new ForbiddenException('You can only feature your own store');
    }

    const now = new Date();
    const sku =
      settings.pricing.skus.featured_store_homepage ??
      ({ amount: 2.99, enabled: true } as const);
    const slotsPerDay = storeHomepageSlotsPerDay(settings.pricing.featured ?? {});
    const slotsUsed = await this.prisma.store.count({
      where: buildActiveFeaturedStoreWhere(now),
    });
    const slotsRemaining = Math.max(0, slotsPerDay - slotsUsed);
    const enabled = Boolean(sku.enabled) && featuredEnabled;

    let reason: string | undefined;
    let eligible = true;
    if (!sellerVerified) {
      eligible = false;
      reason = SELLER_VERIFICATION_MESSAGES.MONETIZATION_REQUIRES_VERIFICATION;
    } else if (!featuredEnabled) {
      eligible = false;
      reason = 'featured_disabled';
    } else if (!sku.enabled) {
      eligible = false;
      reason = 'featured_disabled';
    } else if (slotsRemaining <= 0) {
      eligible = false;
      reason = 'slots_full';
    }

    return {
      featuredEnabled,
      currency: settings.pricing.currency,
      option: {
        amount: sku.amount,
        durationHours: FEATURED_DURATION_HOURS,
        slotsPerDay,
        slotsUsed,
        slotsRemaining,
        enabled,
        eligible,
        reason,
      },
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        isFeatured: isStoreFeatured(store),
        featuredUntil: store.featuredUntil?.toISOString(),
      },
    };
  }
}
