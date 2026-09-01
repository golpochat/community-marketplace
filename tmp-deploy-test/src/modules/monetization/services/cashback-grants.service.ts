import { Injectable } from '@nestjs/common';

import type { CashbackEstimate, PaymentMethod } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { mapCashbackGrant, roundMoney } from '../mappers/monetization.mapper';
import { PlatformSettingsService } from './platform-settings.service';

@Injectable()
export class CashbackGrantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: PlatformSettingsService,
  ) {}

  async createPendingGrantForPayment(paymentId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.status !== 'succeeded') return;

    const settings = await this.settings.get();
    const amount = Number(payment.amount);
    const method = payment.method as PaymentMethod;

    if (!this.isEligible(settings, method, amount)) return;

    const grantAmount = roundMoney(
      Math.min(
        amount * (settings.cashbackPercent / 100),
        settings.maxCashbackPerOrder,
      ),
    );
    if (grantAmount <= 0) return;

    const unlockAt = new Date();
    unlockAt.setDate(unlockAt.getDate() + settings.coolingDays);

    await this.prisma.cashbackGrant.upsert({
      where: { paymentId },
      create: {
        userId: payment.buyerId,
        paymentId: payment.id,
        amount: grantAmount,
        status: 'pending',
        unlockAt,
      },
      update: {},
    });
  }

  async cancelGrantsForPayment(paymentId: string): Promise<void> {
    await this.prisma.cashbackGrant.updateMany({
      where: { paymentId, status: 'pending' },
      data: { status: 'cancelled' },
    });
  }

  async processUnlocks(): Promise<number> {
    const now = new Date();
    const pending = await this.prisma.cashbackGrant.findMany({
      where: {
        status: 'pending',
        unlockAt: { lte: now },
      },
      take: 200,
      orderBy: { unlockAt: 'asc' },
    });

    let unlocked = 0;
    for (const grant of pending) {
      const payment = await this.prisma.payment.findUnique({
        where: { id: grant.paymentId },
        select: { status: true },
      });
      if (!payment || payment.status !== 'succeeded') {
        await this.prisma.cashbackGrant.update({
          where: { id: grant.id },
          data: { status: 'cancelled' },
        });
        continue;
      }

      const settings = await this.settings.get();
      const earnedThisMonth = await this.sumEarnedThisMonth(grant.userId);
      const remainingCap = settings.maxCashbackPerMonth - earnedThisMonth;
      if (remainingCap <= 0) {
        await this.prisma.cashbackGrant.update({
          where: { id: grant.id },
          data: { status: 'cancelled' },
        });
        continue;
      }

      const creditAmount = roundMoney(Math.min(Number(grant.amount), remainingCap));
      if (creditAmount <= 0) {
        await this.prisma.cashbackGrant.update({
          where: { id: grant.id },
          data: { status: 'cancelled' },
        });
        continue;
      }

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 6);

      await this.prisma.$transaction(async (tx) => {
        await tx.buyerWallet.upsert({
          where: { userId: grant.userId },
          create: { userId: grant.userId, balance: creditAmount },
          update: { balance: { increment: creditAmount } },
        });

        await tx.walletTransaction.create({
          data: {
            userId: grant.userId,
            type: 'cashback_earned',
            amount: creditAmount,
            sourcePaymentId: grant.paymentId,
            expiresAt,
          },
        });

        await tx.cashbackGrant.update({
          where: { id: grant.id },
          data: { status: 'earned', amount: creditAmount },
        });
      });

      unlocked += 1;
    }

    return unlocked;
  }

  async estimateForListing(
    buyerId: string,
    listingId: string,
  ): Promise<CashbackEstimate> {
    const settings = await this.settings.get();
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { price: true, status: true, sellerId: true },
    });

    if (!listing || listing.status !== 'active') {
      return {
        eligible: false,
        amount: 0,
        unlockAt: new Date().toISOString(),
        cashbackPercent: settings.cashbackPercent,
        reason: 'Listing is not available',
      };
    }

    const amount = Number(listing.price);
    if (!this.isEligible(settings, 'card', amount)) {
      return {
        eligible: false,
        amount: 0,
        unlockAt: new Date().toISOString(),
        cashbackPercent: settings.cashbackPercent,
        reason: !settings.cashbackEnabled
          ? 'Cashback is not currently available'
          : amount < settings.cashbackMinOrderAmount
            ? `Minimum order amount is €${settings.cashbackMinOrderAmount}`
            : 'Card payment required for cashback',
      };
    }

    const cashbackAmount = roundMoney(
      Math.min(
        amount * (settings.cashbackPercent / 100),
        settings.maxCashbackPerOrder,
      ),
    );

    const unlockAt = new Date();
    unlockAt.setDate(unlockAt.getDate() + settings.coolingDays);

    return {
      eligible: true,
      amount: cashbackAmount,
      unlockAt: unlockAt.toISOString(),
      cashbackPercent: settings.cashbackPercent,
    };
  }

  async listGrantsAdmin(filters: {
    page: number;
    limit: number;
    status?: 'pending' | 'earned' | 'cancelled';
    userId?: string;
  }) {
    const where = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.cashbackGrant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.cashbackGrant.count({ where }),
    ]);

    return {
      data: rows.map(mapCashbackGrant),
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / filters.limit)),
      },
    };
  }

  private isEligible(
    settings: Awaited<ReturnType<PlatformSettingsService['get']>>,
    method: PaymentMethod,
    amount: number,
  ): boolean {
    if (!settings.cashbackEnabled) return false;
    if (!settings.allowedCashbackMethods.includes(method)) return false;
    if (amount < settings.cashbackMinOrderAmount) return false;
    return true;
  }

  private async sumEarnedThisMonth(userId: string): Promise<number> {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const rows = await this.prisma.walletTransaction.findMany({
      where: {
        userId,
        type: 'cashback_earned',
        createdAt: { gte: start },
      },
      select: { amount: true },
    });

    return rows.reduce((sum, row) => sum + Number(row.amount), 0);
  }
}
