import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { buildStatementNumber } from '../lib/account-statement.types';

@Injectable()
export class BuyerStatementFulfillmentService {
  constructor(private readonly prisma: PrismaService) {}

  async fulfillBuyerStatement(purchaseId: string): Promise<boolean> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase || purchase.type !== 'buyer_statement') return false;
    if (purchase.status === 'succeeded' && purchase.fulfilledAt) return true;

    const metadata = this.readMetadata(purchase.metadata);
    const year = Number(metadata.year);
    const month = Number(metadata.month);
    if (!year || !month) return false;

    const now = new Date();
    const receiptNumber =
      purchase.receiptNumber ?? buildStatementNumber('buyer', year, month, purchase.userId);

    await this.prisma.platformPurchase.update({
      where: { id: purchaseId },
      data: {
        status: 'succeeded',
        fulfilledAt: now,
        receiptNumber,
        metadata: {
          ...metadata,
          fulfilledAt: now.toISOString(),
        },
      },
    });

    return true;
  }

  private readMetadata(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
  }
}
