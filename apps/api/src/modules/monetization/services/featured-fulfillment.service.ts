import { Injectable } from '@nestjs/common';

import type { FeaturedPlacement } from '@community-marketplace/types';

import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../database/prisma.service';
import { listingInclude } from '../../listings/mappers/listing.mapper';
import { computeFeaturedUntil } from '../lib/featured.lib';

@Injectable()
export class FeaturedFulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async fulfillFeaturedSlot(purchaseId: string): Promise<boolean> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) return false;
    if (purchase.status === 'succeeded' && purchase.fulfilledAt) {
      return true;
    }
    if (!purchase.listingId) {
      return false;
    }

    const metadata =
      purchase.metadata && typeof purchase.metadata === 'object' && !Array.isArray(purchase.metadata)
        ? (purchase.metadata as Record<string, unknown>)
        : {};
    const placement = metadata.placement as FeaturedPlacement | undefined;
    if (!placement || (placement !== 'homepage' && placement !== 'category')) {
      return false;
    }

    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.platformPurchase.findUnique({ where: { id: purchaseId } });
      if (!current || (current.status === 'succeeded' && current.fulfilledAt)) {
        return null;
      }

      const listing = await tx.listing.findUnique({ where: { id: purchase.listingId! } });
      if (!listing) {
        throw new Error('Listing not found for featured fulfillment');
      }

      const featuredUntil = computeFeaturedUntil(listing.featuredUntil, now);

      await tx.listing.update({
        where: { id: listing.id },
        data: {
          isFeatured: true,
          featuredUntil,
          featuredPlacement: placement,
        },
      });

      await tx.platformPurchase.update({
        where: { id: purchaseId },
        data: {
          status: 'succeeded',
          fulfilledAt: now,
        },
      });

      return listing.id;
    });

    if (!result) return true;

    this.eventBus.publish({
      type: 'listing.featured',
      payload: {
        listingId: result,
        purchaseId,
        placement,
      },
      timestamp: now,
    });
    this.eventBus.publish({
      type: 'listing.updated',
      payload: { listingId: result },
      timestamp: now,
    });

    return true;
  }

  async reindexListing(listingId: string) {
    return this.prisma.listing.findUnique({
      where: { id: listingId },
      include: listingInclude,
    });
  }
}
