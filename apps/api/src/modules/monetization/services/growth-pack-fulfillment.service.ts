import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class GrowthPackFulfillmentService {
  constructor(private readonly prisma: PrismaService) {}

  async fulfillGrowthPack(purchaseId: string): Promise<boolean> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) return false;
    if (purchase.type !== 'seller_growth_pack') return false;
    if (purchase.status === 'succeeded' && purchase.fulfilledAt) {
      return true;
    }

    const metadata = (purchase.metadata ?? {}) as Record<string, unknown>;
    const walletCreditEur = Number(metadata.walletCreditEur ?? 0);
    const boostDiscountPercent = Number(metadata.boostDiscountPercent ?? 0);

    await this.prisma.$transaction(async (tx) => {
      const current = await tx.platformPurchase.findUnique({
        where: { id: purchaseId },
      });
      if (!current || (current.status === 'succeeded' && current.fulfilledAt)) {
        return;
      }

      if (walletCreditEur > 0) {
        const existing = await tx.buyerWallet.findUnique({
          where: { userId: purchase.userId },
        });
        const nextBalance =
          (existing ? Number(existing.balance) : 0) + walletCreditEur;
        await tx.buyerWallet.upsert({
          where: { userId: purchase.userId },
          create: { userId: purchase.userId, balance: nextBalance },
          update: { balance: nextBalance },
        });
        await tx.walletTransaction.create({
          data: {
            userId: purchase.userId,
            type: 'credit_topup',
            amount: walletCreditEur,
          },
        });
      }

      await tx.platformPurchase.update({
        where: { id: purchaseId },
        data: {
          status: 'succeeded',
          fulfilledAt: new Date(),
          metadata: {
            ...metadata,
            walletCreditEur,
            boostDiscountPercent,
            boostDiscountConsumed: false,
            fulfilled: true,
          } as Prisma.InputJsonValue,
        },
      });
    });

    return true;
  }

  async fulfillAiCreditPack(purchaseId: string): Promise<boolean> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) return false;
    if (
      purchase.type !== 'ai_credit_2' &&
      purchase.type !== 'ai_credit_5' &&
      purchase.type !== 'ai_credit_10'
    ) {
      return false;
    }
    if (purchase.status === 'succeeded' && purchase.fulfilledAt) {
      return true;
    }

    const metadata = (purchase.metadata ?? {}) as Record<string, unknown>;
    const walletCreditEur = Number(metadata.walletCreditEur ?? 0);

    await this.prisma.$transaction(async (tx) => {
      const current = await tx.platformPurchase.findUnique({
        where: { id: purchaseId },
      });
      if (!current || (current.status === 'succeeded' && current.fulfilledAt)) {
        return;
      }

      if (walletCreditEur > 0) {
        const existing = await tx.buyerWallet.findUnique({
          where: { userId: purchase.userId },
        });
        const nextBalance =
          (existing ? Number(existing.balance) : 0) + walletCreditEur;
        await tx.buyerWallet.upsert({
          where: { userId: purchase.userId },
          create: { userId: purchase.userId, balance: nextBalance },
          update: { balance: nextBalance },
        });
        await tx.walletTransaction.create({
          data: {
            userId: purchase.userId,
            type: 'credit_topup',
            amount: walletCreditEur,
          },
        });
      }

      await tx.platformPurchase.update({
        where: { id: purchaseId },
        data: {
          status: 'succeeded',
          fulfilledAt: new Date(),
          metadata: {
            ...metadata,
            walletCreditEur,
            fulfilled: true,
          } as Prisma.InputJsonValue,
        },
      });
    });

    return true;
  }

  async markBoostDiscountConsumed(purchaseId: string): Promise<void> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase || purchase.type !== 'seller_growth_pack') return;
    const metadata = (purchase.metadata ?? {}) as Record<string, unknown>;
    if (metadata.boostDiscountConsumed === true) return;
    await this.prisma.platformPurchase.update({
      where: { id: purchaseId },
      data: {
        metadata: {
          ...metadata,
          boostDiscountConsumed: true,
        } as Prisma.InputJsonValue,
      },
    });
  }
}
