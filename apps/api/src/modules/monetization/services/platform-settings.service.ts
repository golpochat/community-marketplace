import { Injectable } from '@nestjs/common';

import type { Prisma } from '@prisma/client';

import type { MonetizationSettings } from '@community-marketplace/types';
import type { PlatformSettingsUpdateInput } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { DEFAULT_PLATFORM_PRICING } from '../lib/boost.lib';
import {
  getDefaultPlatformSettings,
  mapPlatformSettings,
  mergePricingUpdate,
} from '../mappers/monetization.mapper';

@Injectable()
export class PlatformSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<MonetizationSettings> {
    const row = await this.prisma.platformSettings.findUnique({
      where: { id: 'default' },
    });
    if (!row) {
      return this.ensureDefaults();
    }
    return mapPlatformSettings(row);
  }

  async update(input: PlatformSettingsUpdateInput): Promise<MonetizationSettings> {
    const current = await this.ensureDefaults();
    const pricing = mergePricingUpdate(current.pricing, {
      boostPrice7d: input.boostPrice7d,
      boostPrice30d: input.boostPrice30d,
      featuredHomepagePrice: input.featuredHomepagePrice,
      featuredCategoryPrice: input.featuredCategoryPrice,
      fastTrackVerificationPrice: input.fastTrackVerificationPrice,
      storeSlot2Price: input.storeSlot2Price,
      storeSlot3Price: input.storeSlot3Price,
      storeBundle3Price: input.storeBundle3Price,
      homepageSlotsPerDay: input.homepageSlotsPerDay,
      categorySlotsPerDay: input.categorySlotsPerDay,
      aiMarketingFreeUnitsMonthly: input.aiMarketingFreeUnitsMonthly,
    });

    const pricingChanged =
      input.boostPrice7d !== undefined ||
      input.boostPrice30d !== undefined ||
      input.featuredHomepagePrice !== undefined ||
      input.featuredCategoryPrice !== undefined ||
      input.fastTrackVerificationPrice !== undefined ||
      input.storeSlot2Price !== undefined ||
      input.storeSlot3Price !== undefined ||
      input.storeBundle3Price !== undefined ||
      input.homepageSlotsPerDay !== undefined ||
      input.categorySlotsPerDay !== undefined ||
      input.aiMarketingFreeUnitsMonthly !== undefined;

    const row = await this.prisma.platformSettings.update({
      where: { id: 'default' },
      data: {
        ...(input.defaultPlatformFeePercent !== undefined
          ? { defaultPlatformFeePercent: input.defaultPlatformFeePercent }
          : {}),
        ...(input.verifiedSellerFeePercent !== undefined
          ? { verifiedSellerFeePercent: input.verifiedSellerFeePercent }
          : {}),
        ...(input.cashbackPercent !== undefined
          ? { cashbackPercent: input.cashbackPercent }
          : {}),
        ...(input.coolingDays !== undefined ? { coolingDays: input.coolingDays } : {}),
        ...(input.maxCashbackPerOrder !== undefined
          ? { maxCashbackPerOrder: input.maxCashbackPerOrder }
          : {}),
        ...(input.maxCashbackPerMonth !== undefined
          ? { maxCashbackPerMonth: input.maxCashbackPerMonth }
          : {}),
        ...(input.cashbackEnabled !== undefined
          ? { cashbackEnabled: input.cashbackEnabled }
          : {}),
        ...(input.cashbackMinOrderAmount !== undefined
          ? { cashbackMinOrderAmount: input.cashbackMinOrderAmount }
          : {}),
        ...(input.allowedCashbackMethods !== undefined
          ? { allowedCashbackMethods: input.allowedCashbackMethods }
          : {}),
        ...(input.boostsEnabled !== undefined ? { boostsEnabled: input.boostsEnabled } : {}),
        ...(input.featuredEnabled !== undefined
          ? { featuredEnabled: input.featuredEnabled }
          : {}),
        ...(input.displayAdsEnabled !== undefined
          ? { displayAdsEnabled: input.displayAdsEnabled }
          : {}),
        ...(input.aiMarketingEnabled !== undefined
          ? { aiMarketingEnabled: input.aiMarketingEnabled }
          : {}),
        ...(pricingChanged
          ? { pricing: pricing as unknown as Prisma.InputJsonValue }
          : {}),
      },
    });
    return mapPlatformSettings(row);
  }

  private async ensureDefaults(): Promise<MonetizationSettings> {
    const defaults = getDefaultPlatformSettings();
    const row = await this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        defaultPlatformFeePercent: defaults.defaultPlatformFeePercent,
        verifiedSellerFeePercent: defaults.verifiedSellerFeePercent,
        cashbackPercent: defaults.cashbackPercent,
        coolingDays: defaults.coolingDays,
        maxCashbackPerOrder: defaults.maxCashbackPerOrder,
        maxCashbackPerMonth: defaults.maxCashbackPerMonth,
        cashbackEnabled: defaults.cashbackEnabled,
        cashbackMinOrderAmount: defaults.cashbackMinOrderAmount,
        allowedCashbackMethods: defaults.allowedCashbackMethods,
        pricing: DEFAULT_PLATFORM_PRICING as unknown as Prisma.InputJsonValue,
        boostsEnabled: defaults.boostsEnabled,
        featuredEnabled: defaults.featuredEnabled,
        displayAdsEnabled: defaults.displayAdsEnabled,
        aiMarketingEnabled: defaults.aiMarketingEnabled,
        emailProvider: 'brevo',
        emailFallbackEnabled: false,
      },
      update: {},
    });
    return mapPlatformSettings(row);
  }
}
