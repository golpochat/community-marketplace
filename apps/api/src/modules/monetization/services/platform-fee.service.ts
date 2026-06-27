import { Injectable } from '@nestjs/common';

import type { SellerPlatformFeeInfo } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { roundMoney } from '../mappers/monetization.mapper';
import { PlatformSettingsService } from './platform-settings.service';

@Injectable()
export class PlatformFeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: PlatformSettingsService,
  ) {}

  async getEffectiveFeePercent(sellerId: string): Promise<number> {
    const [seller, platform] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: sellerId },
        select: { customPlatformFeePercent: true },
      }),
      this.settings.get(),
    ]);

    if (seller?.customPlatformFeePercent != null) {
      return Number(seller.customPlatformFeePercent);
    }

    return (
      platform.defaultPlatformFeePercent ??
      Number(process.env.PLATFORM_FEE_PERCENT ?? 10)
    );
  }

  async calculatePlatformFee(
    amount: number,
    sellerId: string,
  ): Promise<{ feePercent: number; platformFee: number }> {
    const feePercent = await this.getEffectiveFeePercent(sellerId);
    const platformFee = roundMoney(amount * (feePercent / 100));
    return { feePercent, platformFee };
  }

  async getSellerFeeInfo(sellerId: string): Promise<SellerPlatformFeeInfo> {
    const [seller, platform] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: sellerId },
        select: { customPlatformFeePercent: true },
      }),
      this.settings.get(),
    ]);

    const defaultFeePercent = platform.defaultPlatformFeePercent;
    const isCustomOverride = seller?.customPlatformFeePercent != null;
    const effectiveFeePercent = isCustomOverride
      ? Number(seller!.customPlatformFeePercent)
      : defaultFeePercent;

    return {
      effectiveFeePercent,
      isCustomOverride,
      defaultFeePercent,
    };
  }

  async setSellerFeeOverride(
    adminId: string,
    userId: string,
    customPlatformFeePercent: number | null,
    reason?: string,
  ) {
    const before = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { customPlatformFeePercent: true },
    });
    if (!before) return null;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { customPlatformFeePercent },
      select: { id: true, customPlatformFeePercent: true },
    });

    await this.prisma.userAuditLog.create({
      data: {
        eventType: customPlatformFeePercent == null ? 'seller_fee_override_cleared' : 'seller_fee_override_set',
        actorId: adminId,
        targetUserId: userId,
        metadata: {
          oldPercent: before.customPlatformFeePercent
            ? Number(before.customPlatformFeePercent)
            : null,
          newPercent: customPlatformFeePercent,
          reason: reason ?? null,
        },
      },
    });

    return updated;
  }
}
