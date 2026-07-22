import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { roundMoney } from '../lib/boost.lib';

@Injectable()
export class WalletSpendService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string): Promise<number> {
    const wallet = await this.prisma.buyerWallet.findUnique({
      where: { userId },
      select: { balance: true },
    });
    return wallet ? Number(wallet.balance) : 0;
  }

  /**
   * Debit wallet for a platform purchase. Idempotent when `alreadyDebited` is true
   * (caller checks purchase metadata).
   */
  async debitForPlatformPurchase(input: {
    userId: string;
    amount: number;
    purchaseId: string;
    tx?: Prisma.TransactionClient;
  }): Promise<{ balanceAfter: number; transactionId: string }> {
    const amount = roundMoney(input.amount);
    if (amount <= 0) {
      throw new BadRequestException('Credits amount must be greater than zero');
    }

    const run = async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.buyerWallet.findUnique({
        where: { userId: input.userId },
      });
      const balance = wallet ? Number(wallet.balance) : 0;
      if (balance + 1e-9 < amount) {
        throw new BadRequestException('Insufficient SellNearby Credit balance');
      }

      const nextBalance = roundMoney(balance - amount);
      await tx.buyerWallet.upsert({
        where: { userId: input.userId },
        create: { userId: input.userId, balance: nextBalance },
        update: { balance: nextBalance },
      });

      const row = await tx.walletTransaction.create({
        data: {
          userId: input.userId,
          type: 'spent',
          amount,
        },
      });

      return { balanceAfter: nextBalance, transactionId: row.id };
    };

    if (input.tx) return run(input.tx);
    return this.prisma.$transaction((tx) => run(tx));
  }
}
