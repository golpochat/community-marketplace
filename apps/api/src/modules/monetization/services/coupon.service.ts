import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CouponQuote,
  PlatformCoupon,
  PlatformPurchaseType,
} from '@community-marketplace/types';
import type { CreateCouponInput } from '@community-marketplace/validation';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import {
  isPurchaseTypeAllowed,
  normalizeCouponCode,
  quoteCouponDiscount,
} from '../lib/coupon.lib';

@Injectable()
export class CouponService {
  constructor(private readonly prisma: PrismaService) {}

  async listCoupons(): Promise<PlatformCoupon[]> {
    const rows = await this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { redemptions: true } } },
    });
    return rows.map((row) => this.mapCoupon(row));
  }

  async createCoupon(adminId: string, input: CreateCouponInput): Promise<PlatformCoupon> {
    const code = normalizeCouponCode(input.code);
    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      throw new ConflictException('A coupon with this code already exists');
    }

    const row = await this.prisma.coupon.create({
      data: {
        code,
        discountType: input.discountType,
        discountValue: input.discountValue,
        allowedPurchaseTypes: input.allowedPurchaseTypes ?? [],
        maxRedemptions: input.maxRedemptions ?? null,
        maxPerUser: input.maxPerUser ?? 1,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        createdById: adminId,
      },
      include: { _count: { select: { redemptions: true } } },
    });
    return this.mapCoupon(row);
  }

  async deactivateCoupon(couponId: string): Promise<PlatformCoupon> {
    const existing = await this.prisma.coupon.findUnique({
      where: { id: couponId },
      include: { _count: { select: { redemptions: true } } },
    });
    if (!existing) throw new NotFoundException('Coupon not found');

    const row = await this.prisma.coupon.update({
      where: { id: couponId },
      data: { active: false },
      include: { _count: { select: { redemptions: true } } },
    });
    return this.mapCoupon(row);
  }

  /**
   * Validates a code for a platform-purchase SKU and returns the discounted quote.
   * Never used for card commission / Payment intents.
   */
  async validateAndQuote(
    code: string,
    userId: string,
    purchaseType: PlatformPurchaseType,
    baseAmount: number,
  ): Promise<CouponQuote> {
    const normalized = normalizeCouponCode(code);
    if (!normalized) {
      throw new BadRequestException('Coupon code is required');
    }

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: normalized },
      include: { _count: { select: { redemptions: true } } },
    });
    if (!coupon || !coupon.active) {
      throw new BadRequestException('Invalid or inactive coupon code');
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException('This coupon is not active yet');
    }
    if (coupon.endsAt && coupon.endsAt < now) {
      throw new BadRequestException('This coupon has expired');
    }
    if (!isPurchaseTypeAllowed(coupon.allowedPurchaseTypes, purchaseType)) {
      throw new BadRequestException('This coupon does not apply to this purchase');
    }
    if (
      coupon.maxRedemptions != null &&
      coupon._count.redemptions >= coupon.maxRedemptions
    ) {
      throw new BadRequestException('This coupon has reached its redemption limit');
    }

    const userRedemptions = await this.prisma.couponRedemption.count({
      where: { couponId: coupon.id, userId },
    });
    if (userRedemptions >= coupon.maxPerUser) {
      throw new BadRequestException('You have already used this coupon');
    }

    const { finalAmount, amountSaved } = quoteCouponDiscount({
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      baseAmount,
    });
    if (amountSaved <= 0) {
      throw new BadRequestException('This coupon does not change the price');
    }

    return {
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      baseAmount,
      finalAmount,
      amountSaved,
    };
  }

  async recordRedemption(purchaseId: string): Promise<void> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
      select: {
        id: true,
        userId: true,
        couponId: true,
        status: true,
        metadata: true,
      },
    });
    if (!purchase || purchase.status !== 'succeeded' || !purchase.couponId) {
      return;
    }

    const existing = await this.prisma.couponRedemption.findUnique({
      where: { platformPurchaseId: purchase.id },
    });
    if (existing) return;

    const meta = (purchase.metadata ?? {}) as Record<string, unknown>;
    const amountSaved = Number(meta.couponAmountSaved ?? 0);

    await this.prisma.couponRedemption.create({
      data: {
        couponId: purchase.couponId,
        userId: purchase.userId,
        platformPurchaseId: purchase.id,
        amountSaved: Number.isFinite(amountSaved) ? amountSaved : 0,
      },
    });
  }

  private mapCoupon(
    row: {
      id: string;
      code: string;
      discountType: 'percent' | 'fixed';
      discountValue: Prisma.Decimal | number;
      allowedPurchaseTypes: Prisma.JsonValue;
      maxRedemptions: number | null;
      maxPerUser: number;
      startsAt: Date | null;
      endsAt: Date | null;
      active: boolean;
      createdById: string;
      createdAt: Date;
      updatedAt: Date;
      _count: { redemptions: number };
    },
  ): PlatformCoupon {
    const allowed = Array.isArray(row.allowedPurchaseTypes)
      ? (row.allowedPurchaseTypes as PlatformPurchaseType[])
      : [];
    return {
      id: row.id,
      code: row.code,
      discountType: row.discountType,
      discountValue: Number(row.discountValue),
      allowedPurchaseTypes: allowed,
      maxRedemptions: row.maxRedemptions ?? undefined,
      maxPerUser: row.maxPerUser,
      startsAt: row.startsAt?.toISOString(),
      endsAt: row.endsAt?.toISOString(),
      active: row.active,
      redemptionCount: row._count.redemptions,
      createdById: row.createdById,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
