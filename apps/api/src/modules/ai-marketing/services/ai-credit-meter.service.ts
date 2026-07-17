import { Injectable } from '@nestjs/common';

import {
  AI_MARKETING_FREE_UNITS_MONTHLY,
  isSellerVerified,
  type AiBillingMethod,
  type AiMarketingTask,
  type SellerStatus,
} from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AiCreditMeterService {
  constructor(private readonly prisma: PrismaService) {}

  async getWalletBalance(userId: string): Promise<number> {
    const wallet = await this.prisma.buyerWallet.findUnique({
      where: { userId },
    });
    return wallet ? Number(wallet.balance) : 0;
  }

  async countFreeUnitsUsedThisMonth(userId: string): Promise<number> {
    const { start, end } = this.monthBounds();
    const rows = await this.prisma.aiGenerationLog.findMany({
      where: {
        userId,
        billingMethod: 'free_quota',
        createdAt: { gte: start, lt: end },
      },
      select: { creditUnits: true },
    });
    return rows.reduce((sum, row) => sum + row.creditUnits, 0);
  }

  async countGenerationsToday(userId: string): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.prisma.aiGenerationLog.count({
      where: { userId, createdAt: { gte: start } },
    });
  }

  async countGenerationsTodayForListing(
    userId: string,
    listingId: string,
  ): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.prisma.aiGenerationLog.count({
      where: { userId, listingId, createdAt: { gte: start } },
    });
  }

  async recordGeneration(input: {
    userId: string;
    listingId?: string;
    task: AiMarketingTask;
    provider: string;
    model: string;
    promptVersion: string;
    billingMethod: AiBillingMethod;
    creditUnits: number;
    amountEur: number;
    inputSummary: string;
    outputText: string;
  }): Promise<{
    generationId: string;
    walletBalance: number;
    freeUnitsRemaining: number;
  }> {
    const result = await this.prisma.$transaction(async (tx) => {
      let walletTransactionId: string | undefined;
      let walletBalance = 0;

      const existingWallet = await tx.buyerWallet.findUnique({
        where: { userId: input.userId },
      });
      walletBalance = existingWallet ? Number(existingWallet.balance) : 0;

      if (input.billingMethod === 'wallet' && input.amountEur > 0) {
        const nextBalance = Math.max(0, walletBalance - input.amountEur);
        await tx.buyerWallet.upsert({
          where: { userId: input.userId },
          create: { userId: input.userId, balance: nextBalance },
          update: { balance: nextBalance },
        });

        const txRow = await tx.walletTransaction.create({
          data: {
            userId: input.userId,
            type: 'ai_generation',
            amount: input.amountEur,
          },
        });
        walletTransactionId = txRow.id;
        walletBalance = nextBalance;
      }

      const log = await tx.aiGenerationLog.create({
        data: {
          userId: input.userId,
          listingId: input.listingId,
          task: input.task,
          provider: input.provider,
          model: input.model,
          promptVersion: input.promptVersion,
          billingMethod: input.billingMethod,
          creditUnits: input.creditUnits,
          amountEur: input.amountEur,
          walletTransactionId,
          inputSummary: input.inputSummary,
          outputText: input.outputText,
        },
      });

      return { generationId: log.id, walletBalance };
    });

    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { sellerStatus: true },
    });
    const verified = isSellerVerified(user?.sellerStatus as SellerStatus);
    const freeUsed = await this.countFreeUnitsUsedThisMonth(input.userId);
    const freeUnitsRemaining = verified
      ? Math.max(0, AI_MARKETING_FREE_UNITS_MONTHLY - freeUsed)
      : 0;

    return {
      generationId: result.generationId,
      walletBalance: result.walletBalance,
      freeUnitsRemaining,
    };
  }

  private monthBounds(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
  }
}
