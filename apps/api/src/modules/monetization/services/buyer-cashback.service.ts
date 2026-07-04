import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { PlatformSettingsService } from './platform-settings.service';

@Injectable()
export class BuyerCashbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: PlatformSettingsService,
  ) {}

  async resolvePercentForBuyer(buyerId: string): Promise<number> {
    const [buyer, platform] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: buyerId },
        select: { customCashbackPercent: true },
      }),
      this.settings.get(),
    ]);

    if (buyer?.customCashbackPercent != null) {
      return Number(buyer.customCashbackPercent);
    }

    return platform.cashbackPercent;
  }

  async setBuyerCashbackOverride(
    adminId: string,
    userId: string,
    customCashbackPercent: number | null,
    reason?: string,
  ) {
    const before = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { customCashbackPercent: true },
    });
    if (!before) throw new NotFoundException('Buyer not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { customCashbackPercent },
      select: { id: true, customCashbackPercent: true },
    });

    await this.prisma.userAuditLog.create({
      data: {
        eventType:
          customCashbackPercent == null
            ? 'buyer_cashback_override_cleared'
            : 'buyer_cashback_override_set',
        actorId: adminId,
        targetUserId: userId,
        metadata: {
          oldPercent: before.customCashbackPercent
            ? Number(before.customCashbackPercent)
            : null,
          newPercent: customCashbackPercent,
          reason: reason ?? null,
        },
      },
    });

    return updated;
  }

  async listBuyerCashbackOverrides() {
    const platform = await this.settings.get();
    const rows = await this.prisma.user.findMany({
      where: {
        customCashbackPercent: { not: null },
        primaryRole: { code: 'BUYER' },
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        customCashbackPercent: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row) => ({
      userId: row.id,
      displayName: row.displayName ?? undefined,
      email: row.email,
      customCashbackPercent: Number(row.customCashbackPercent),
      defaultCashbackPercent: platform.cashbackPercent,
    }));
  }

  async searchBuyers(query: string, limit = 10) {
    const platform = await this.settings.get();
    const trimmed = query.trim();
    const orFilters: Array<Record<string, unknown>> = [
      { email: { contains: trimmed, mode: 'insensitive' } },
      { displayName: { contains: trimmed, mode: 'insensitive' } },
    ];
    if (/^[0-9a-f-]{8,}$/i.test(trimmed)) {
      orFilters.push({ id: { startsWith: trimmed } });
    }

    const rows = await this.prisma.user.findMany({
      where: {
        primaryRole: { code: 'BUYER' },
        OR: orFilters,
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        customCashbackPercent: true,
      },
      take: limit,
      orderBy: { displayName: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id,
      displayName: row.displayName ?? undefined,
      email: row.email,
      customCashbackPercent:
        row.customCashbackPercent != null
          ? Number(row.customCashbackPercent)
          : undefined,
      effectiveCashbackPercent:
        row.customCashbackPercent != null
          ? Number(row.customCashbackPercent)
          : platform.cashbackPercent,
    }));
  }
}
