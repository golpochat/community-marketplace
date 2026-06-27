import { Injectable } from '@nestjs/common';

import type { MonetizationSettings } from '@community-marketplace/types';
import type { PlatformSettingsUpdateInput } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import {
  getDefaultPlatformSettings,
  mapPlatformSettings,
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
    await this.ensureDefaults();
    const row = await this.prisma.platformSettings.update({
      where: { id: 'default' },
      data: {
        ...(input.defaultPlatformFeePercent !== undefined
          ? { defaultPlatformFeePercent: input.defaultPlatformFeePercent }
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
        cashbackPercent: defaults.cashbackPercent,
        coolingDays: defaults.coolingDays,
        maxCashbackPerOrder: defaults.maxCashbackPerOrder,
        maxCashbackPerMonth: defaults.maxCashbackPerMonth,
        cashbackEnabled: defaults.cashbackEnabled,
        cashbackMinOrderAmount: defaults.cashbackMinOrderAmount,
        allowedCashbackMethods: defaults.allowedCashbackMethods,
      },
      update: {},
    });
    return mapPlatformSettings(row);
  }
}
