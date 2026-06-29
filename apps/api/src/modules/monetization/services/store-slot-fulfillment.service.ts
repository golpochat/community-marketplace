import { Injectable } from '@nestjs/common';

import { STORE_PLATFORM_MAX } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import {
  isStoreSlotSku,
  targetStoreSlotLimit,
  type StoreSlotSku,
} from '../lib/store-slot.lib';

@Injectable()
export class StoreSlotFulfillmentService {
  constructor(private readonly prisma: PrismaService) {}

  async fulfillStoreSlot(purchaseId: string): Promise<boolean> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) return false;
    if (!isStoreSlotSku(purchase.type)) return false;
    if (purchase.status === 'succeeded' && purchase.fulfilledAt) {
      return true;
    }

    const sku = purchase.type as StoreSlotSku;
    const targetLimit = targetStoreSlotLimit(sku);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const current = await tx.platformPurchase.findUnique({ where: { id: purchaseId } });
      if (!current || (current.status === 'succeeded' && current.fulfilledAt)) {
        return;
      }

      const user = await tx.user.findUniqueOrThrow({
        where: { id: purchase.userId },
        select: { storeSlotLimit: true },
      });

      const nextLimit = Math.min(
        STORE_PLATFORM_MAX,
        Math.max(user.storeSlotLimit, targetLimit),
      );

      await tx.user.update({
        where: { id: purchase.userId },
        data: { storeSlotLimit: nextLimit },
      });

      const metadata = this.readMetadata(current.metadata);
      await tx.platformPurchase.update({
        where: { id: purchaseId },
        data: {
          status: 'succeeded',
          fulfilledAt: now,
          metadata: {
            ...metadata,
            targetStoreSlotLimit: targetLimit,
            storeSlotLimitAfter: nextLimit,
          },
        },
      });
    });

    return true;
  }

  readMetadata(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return { ...(value as Record<string, unknown>) };
  }
}
