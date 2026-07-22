import { Injectable, NotFoundException } from '@nestjs/common';

import {
  isSellerVerified,
  type SellerAiFreeUnitsOverrideEntry,
  type SellerStatus,
} from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { PlatformSettingsService } from './platform-settings.service';

@Injectable()
export class AiMarketingQuotaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: PlatformSettingsService,
  ) {}

  /**
   * Effective monthly free AI units for a seller.
   * Custom override wins (including 0). Otherwise verified sellers get the
   * platform default; unverified get 0.
   */
  async getEffectiveFreeUnitsMonthly(userId: string): Promise<number> {
    const [user, platform] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          customAiMarketingFreeUnitsMonthly: true,
          sellerStatus: true,
        },
      }),
      this.settings.get(),
    ]);

    if (user?.customAiMarketingFreeUnitsMonthly != null) {
      return user.customAiMarketingFreeUnitsMonthly;
    }

    if (isSellerVerified(user?.sellerStatus as SellerStatus)) {
      return platform.aiMarketingFreeUnitsMonthly;
    }

    return 0;
  }

  async setSellerOverride(
    adminId: string,
    userId: string,
    customAiMarketingFreeUnitsMonthly: number | null,
    reason?: string,
  ) {
    const before = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { customAiMarketingFreeUnitsMonthly: true },
    });
    if (!before) throw new NotFoundException('Seller not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { customAiMarketingFreeUnitsMonthly },
      select: { id: true, customAiMarketingFreeUnitsMonthly: true },
    });

    await this.prisma.userAuditLog.create({
      data: {
        eventType:
          customAiMarketingFreeUnitsMonthly == null
            ? 'seller_ai_free_units_override_cleared'
            : 'seller_ai_free_units_override_set',
        actorId: adminId,
        targetUserId: userId,
        metadata: {
          oldUnits: before.customAiMarketingFreeUnitsMonthly,
          newUnits: customAiMarketingFreeUnitsMonthly,
          reason: reason ?? null,
        },
      },
    });

    return updated;
  }

  async listSellerOverrides(): Promise<SellerAiFreeUnitsOverrideEntry[]> {
    const platform = await this.settings.get();
    const rows = await this.prisma.user.findMany({
      where: {
        customAiMarketingFreeUnitsMonthly: { not: null },
        primaryRole: { code: 'SELLER' },
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        sellerStatus: true,
        customAiMarketingFreeUnitsMonthly: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row) => ({
      userId: row.id,
      displayName: row.displayName ?? undefined,
      email: row.email,
      sellerStatus: row.sellerStatus,
      customAiMarketingFreeUnitsMonthly: row.customAiMarketingFreeUnitsMonthly!,
      platformFreeUnitsMonthly: platform.aiMarketingFreeUnitsMonthly,
    }));
  }
}
