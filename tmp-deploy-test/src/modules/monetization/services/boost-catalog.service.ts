import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  BoostCatalogResponse,
  BoostPackageType,
  MonetizationSettings,
} from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { packageDurationDays } from '../../listings/lib/listing-lifecycle.lib';
import {
  boostSkuKey,
  isListingBoosted,
} from '../lib/boost.lib';
import { PlatformSettingsService } from './platform-settings.service';

const BOOST_LABELS: Record<BoostPackageType, string> = {
  PAID_7D: '7-day boost',
  PAID_30D: '30-day boost',
};

@Injectable()
export class BoostCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: PlatformSettingsService,
  ) {}

  async getCatalog(
    sellerId: string,
    listingId?: string,
  ): Promise<BoostCatalogResponse> {
    const settings = await this.settings.get();
    const listing = listingId
      ? await this.prisma.listing.findUnique({ where: { id: listingId } })
      : null;

    if (listingId && !listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing && listing.sellerId !== sellerId) {
      throw new ForbiddenException('You can only boost your own listings');
    }

    const options = (['PAID_7D', 'PAID_30D'] as const).map((packageType) => {
      const skuKey = boostSkuKey(packageType);
      const sku = settings.pricing.skus[skuKey];
      const { eligible, reason } = this.evaluateEligibility(
        settings,
        listing,
        packageType,
        sku.enabled,
      );
      return {
        packageType,
        label: BOOST_LABELS[packageType],
        price: sku.amount,
        durationDays: packageDurationDays(packageType),
        eligible,
        reason,
      };
    });

    return {
      boostsEnabled: settings.boostsEnabled,
      currency: settings.pricing.currency,
      options,
      listing: listing
        ? {
            id: listing.id,
            status: listing.status,
            boostedUntil: listing.boostedUntil?.toISOString(),
            isBoosted: isListingBoosted(listing.boostedUntil),
          }
        : undefined,
    };
  }

  private evaluateEligibility(
    settings: MonetizationSettings,
    listing: { status: string } | null,
    packageType: BoostPackageType,
    skuEnabled: boolean,
  ): { eligible: boolean; reason?: string } {
    if (!settings.boostsEnabled) {
      return { eligible: false, reason: 'boosts_disabled' };
    }
    if (!skuEnabled) {
      return { eligible: false, reason: 'boosts_disabled' };
    }
    if (!listing) {
      return { eligible: true };
    }
    if (listing.status !== 'active' && listing.status !== 'paused') {
      return { eligible: false, reason: 'listing_not_active' };
    }
    void packageType;
    return { eligible: true };
  }
}
