import { Injectable } from '@nestjs/common';

import type { BoostPackageType } from '@community-marketplace/types';

import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../database/prisma.service';
import { listingInclude } from '../../listings/mappers/listing.mapper';
import { isPaidPackage } from '../../listings/lib/listing-lifecycle.lib';
import { computeBoostFulfillment } from '../lib/boost.lib';

@Injectable()
export class BoostFulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async fulfillListingBoost(purchaseId: string): Promise<boolean> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) return false;
    if (purchase.status === 'succeeded' && purchase.fulfilledAt) {
      return true;
    }
    if (!purchase.listingId || !purchase.packageType) {
      return false;
    }

    const packageType = purchase.packageType as BoostPackageType;
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.platformPurchase.findUnique({ where: { id: purchaseId } });
      if (!current || (current.status === 'succeeded' && current.fulfilledAt)) {
        return null;
      }

      const listing = await tx.listing.findUnique({ where: { id: purchase.listingId! } });
      if (!listing) {
        throw new Error('Listing not found for boost fulfillment');
      }

      const { boostedUntil, expiresAt } = computeBoostFulfillment(listing, packageType, now);

      await tx.listing.update({
        where: { id: listing.id },
        data: {
          packageType,
          isPaid: isPaidPackage(packageType),
          expiresAt,
          boostedUntil,
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
      type: 'listing.boosted',
      payload: {
        listingId: result,
        purchaseId,
        packageType,
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
    const row = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: listingInclude,
    });
    return row;
  }
}
