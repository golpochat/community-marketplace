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
        select: { customPlatformFeePercent: true, sellerStatus: true },
      }),
      this.settings.get(),
    ]);

    const defaultFeePercent = platform.defaultPlatformFeePercent;
    const verifiedSellerFeePercent = platform.verifiedSellerFeePercent;
    const isCustomOverride = seller?.customPlatformFeePercent != null;
    const effectiveFeePercent = isCustomOverride
      ? Number(seller!.customPlatformFeePercent)
      : defaultFeePercent;
    const isVerifiedRate =
      seller?.sellerStatus === 'verified' &&
      isCustomOverride &&
      effectiveFeePercent === verifiedSellerFeePercent;

    return {
      effectiveFeePercent,
      isCustomOverride,
      defaultFeePercent,
      verifiedSellerFeePercent,
      isVerifiedRate,
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

  async listSellerFeeOverrides(): Promise<
    Array<{
      userId: string;
      displayName?: string;
      email: string;
      sellerStatus: string;
      customPlatformFeePercent: number;
      defaultPlatformFeePercent: number;
      verifiedSellerFeePercent: number;
    }>
  > {
    const platform = await this.settings.get();
    const rows = await this.prisma.user.findMany({
      where: {
        customPlatformFeePercent: { not: null },
        primaryRole: { code: 'SELLER' },
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        sellerStatus: true,
        customPlatformFeePercent: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row) => ({
      userId: row.id,
      displayName: row.displayName ?? undefined,
      email: row.email,
      sellerStatus: row.sellerStatus,
      customPlatformFeePercent: Number(row.customPlatformFeePercent),
      defaultPlatformFeePercent: platform.defaultPlatformFeePercent,
      verifiedSellerFeePercent: platform.verifiedSellerFeePercent,
    }));
  }

  async searchBuyers(query: string, limit = 10) {
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
      },
      take: limit,
      orderBy: { displayName: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id,
      displayName: row.displayName ?? undefined,
      email: row.email,
    }));
  }

  async searchSellers(query: string, limit = 10) {
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
        primaryRole: { code: 'SELLER' },
        OR: orFilters,
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        sellerStatus: true,
        customPlatformFeePercent: true,
        _count: { select: { listings: true } },
      },
      take: limit,
      orderBy: { displayName: 'asc' },
    });

    return rows.map((row) => {
      const effectiveFeePercent =
        row.customPlatformFeePercent != null
          ? Number(row.customPlatformFeePercent)
          : platform.defaultPlatformFeePercent;
      return {
        id: row.id,
        displayName: row.displayName ?? undefined,
        email: row.email,
        sellerStatus: row.sellerStatus,
        customPlatformFeePercent:
          row.customPlatformFeePercent != null
            ? Number(row.customPlatformFeePercent)
            : undefined,
        effectiveFeePercent,
        listingCount: row._count.listings,
      };
    });
  }
}
