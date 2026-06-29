import { BadRequestException, Injectable } from '@nestjs/common';

import type { StoreSlotCatalogResponse } from '@community-marketplace/types';
import { STORE_PLATFORM_MAX } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { roundMoney } from '../lib/boost.lib';
import {
  slotsGrantedBySku,
  storeSlotLabel,
  STORE_SLOT_SKUS,
  targetStoreSlotLimit,
  type StoreSlotSku,
} from '../lib/store-slot.lib';
import { PlatformSettingsService } from './platform-settings.service';

@Injectable()
export class StoreSlotCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: PlatformSettingsService,
  ) {}

  async getCatalog(sellerId: string): Promise<StoreSlotCatalogResponse> {
    const settings = await this.settings.get();
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: sellerId },
      select: { sellerStatus: true, storeSlotLimit: true },
    });
    const storeCount = await this.prisma.store.count({ where: { userId: sellerId } });

    const options = STORE_SLOT_SKUS.map((sku) => {
      const config = settings.pricing.skus[sku];
      const enabled = Boolean(config?.enabled);
      const price = roundMoney(config?.amount ?? 0);
      const targetLimit = targetStoreSlotLimit(sku);
      const slotsGranted = slotsGrantedBySku(sku, user.storeSlotLimit);

      let eligible = enabled && slotsGranted > 0;
      let reason: string | undefined;

      if (user.sellerStatus !== 'verified') {
        eligible = false;
        reason = 'Verify your seller account before purchasing additional storefronts.';
      } else if (!enabled) {
        eligible = false;
        reason = 'This storefront option is not available right now.';
      } else if (user.storeSlotLimit >= STORE_PLATFORM_MAX) {
        eligible = false;
        reason = `You already have the maximum of ${STORE_PLATFORM_MAX} storefront slots.`;
      } else if (user.storeSlotLimit >= targetLimit) {
        eligible = false;
        reason = 'You already own this storefront slot.';
      } else if (storeCount >= STORE_PLATFORM_MAX) {
        eligible = false;
        reason = `You already have ${STORE_PLATFORM_MAX} storefronts on this platform.`;
      }

      return {
        sku,
        label: storeSlotLabel(sku),
        price,
        slotsGranted: eligible ? slotsGranted : 0,
        eligible,
        reason,
      };
    });

    return {
      currency: settings.pricing.currency,
      storeSlotLimit: user.storeSlotLimit,
      storeCount,
      options,
    };
  }

  async assertSkuEligible(sellerId: string, sku: StoreSlotSku): Promise<number> {
    const catalog = await this.getCatalog(sellerId);
    const option = catalog.options.find((item) => item.sku === sku);
    if (!option?.eligible) {
      throw new BadRequestException(
        option?.reason ?? 'This storefront slot is not available.',
      );
    }
    return option.price;
  }
}
