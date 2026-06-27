import { Injectable } from '@nestjs/common';

import type { BuyerWalletSummary } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import {
  emptyWalletSummary,
  mapWalletTransaction,
} from '../mappers/monetization.mapper';
import { PlatformSettingsService } from './platform-settings.service';

@Injectable()
export class BuyerWalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: PlatformSettingsService,
  ) {}

  async getSummary(userId: string): Promise<BuyerWalletSummary> {
    const settings = await this.settings.get();

    const [wallet, pendingGrants, recentTransactions] = await Promise.all([
      this.prisma.buyerWallet.findUnique({ where: { userId } }),
      this.prisma.cashbackGrant.findMany({
        where: { userId, status: 'pending' },
        orderBy: { unlockAt: 'asc' },
        take: 20,
      }),
      this.prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    const base = emptyWalletSummary(settings);

    return {
      ...base,
      balance: wallet ? Number(wallet.balance) : 0,
      pendingUnlocks: pendingGrants.map((grant) => ({
        grantId: grant.id,
        paymentId: grant.paymentId,
        amount: Number(grant.amount),
        unlockAt: grant.unlockAt.toISOString(),
      })),
      recentTransactions: recentTransactions.map(mapWalletTransaction),
    };
  }

  async processExpiries(): Promise<number> {
    const now = new Date();
    const dueCredits = await this.prisma.walletTransaction.findMany({
      where: {
        type: 'cashback_earned',
        expiresAt: { lte: now },
        expiryEntries: { none: {} },
      },
      take: 200,
      orderBy: { expiresAt: 'asc' },
    });

    let expired = 0;
    for (const credit of dueCredits) {
      const amount = Number(credit.amount);
      if (amount <= 0) continue;

      await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.buyerWallet.findUnique({
          where: { userId: credit.userId },
        });
        if (!wallet) return;

        const nextBalance = Math.max(0, Number(wallet.balance) - amount);
        await tx.buyerWallet.update({
          where: { userId: credit.userId },
          data: { balance: nextBalance },
        });

        await tx.walletTransaction.create({
          data: {
            userId: credit.userId,
            type: 'expired',
            amount,
            creditSourceId: credit.id,
            sourcePaymentId: credit.sourcePaymentId,
          },
        });
      });

      expired += 1;
    }

    return expired;
  }

  async listTransactionsAdmin(filters: {
    page: number;
    limit: number;
    userId?: string;
    type?: 'cashback_earned' | 'expired';
  }) {
    const where = {
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.type ? { type: filters.type } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return {
      data: rows.map(mapWalletTransaction),
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / filters.limit)),
      },
    };
  }
}
