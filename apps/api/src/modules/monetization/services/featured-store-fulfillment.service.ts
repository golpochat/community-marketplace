import { Injectable } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../database/prisma.service';
import { computeFeaturedUntil } from '../lib/featured.lib';

@Injectable()
export class FeaturedStoreFulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async fulfillFeaturedStore(purchaseId: string): Promise<boolean> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) return false;
    if (purchase.type !== 'featured_store') return false;
    if (purchase.status === 'succeeded' && purchase.fulfilledAt) {
      return true;
    }

    const metadata =
      purchase.metadata &&
      typeof purchase.metadata === 'object' &&
      !Array.isArray(purchase.metadata)
        ? (purchase.metadata as Record<string, unknown>)
        : {};
    const storeId =
      typeof metadata.storeId === 'string' ? metadata.storeId : undefined;
    if (!storeId) return false;

    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.platformPurchase.findUnique({
        where: { id: purchaseId },
      });
      if (!current || (current.status === 'succeeded' && current.fulfilledAt)) {
        return null;
      }

      const store = await tx.store.findUnique({ where: { id: storeId } });
      if (!store) {
        throw new Error('Store not found for featured store fulfillment');
      }

      const featuredUntil = computeFeaturedUntil(store.featuredUntil, now);

      await tx.store.update({
        where: { id: store.id },
        data: {
          isFeatured: true,
          featuredUntil,
        },
      });

      await tx.platformPurchase.update({
        where: { id: purchaseId },
        data: {
          status: 'succeeded',
          fulfilledAt: now,
          metadata: {
            ...metadata,
            storeId,
            featuredUntil: featuredUntil.toISOString(),
            placement: 'homepage',
          } as import('@prisma/client').Prisma.InputJsonValue,
        },
      });

      return store.id;
    });

    if (!result) return true;

    this.eventBus.publish({
      type: 'store.featured',
      payload: {
        storeId: result,
        purchaseId,
        placement: 'homepage',
      },
      timestamp: now,
    });

    return true;
  }
}
