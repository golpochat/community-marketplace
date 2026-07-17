import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { JobQueueService } from '../../../jobs/job-queue.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { SearchIndexingService } from '../../search/services/search-indexing.service';
import { PrismaService } from '../../../database/prisma.service';
import { isListingFeatured, isStoreFeatured } from '../lib/featured.lib';

const FEATURED_EXPIRY_INTERVAL_MS = 60 * 60 * 1000;

@Injectable()
export class FeaturedExpiryJobService implements OnModuleInit, OnModuleDestroy {
  private intervalTimer?: NodeJS.Timeout;

  constructor(
    private readonly jobQueue: JobQueueService,
    private readonly prisma: PrismaService,
    private readonly indexing: SearchIndexingService,
    private readonly logger: LoggerLib,
  ) {}

  onModuleInit() {
    this.jobQueue.registerHandler('monetization.featured_expiry', async () => {
      const listingCount = await this.expireFeaturedListings();
      const storeCount = await this.expireFeaturedStores();
      this.logger.log(
        'FeaturedExpiryJob',
        `Expired featured: ${listingCount} listings, ${storeCount} stores`,
      );
    });

    void this.jobQueue.enqueue({ name: 'monetization.featured_expiry' });
    this.intervalTimer = setInterval(() => {
      void this.jobQueue.enqueue({ name: 'monetization.featured_expiry' });
    }, FEATURED_EXPIRY_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
  }

  private async expireFeaturedListings(): Promise<number> {
    const now = new Date();
    const since = new Date(now);
    since.setDate(since.getDate() - 2);

    const listings = await this.prisma.listing.findMany({
      where: {
        isFeatured: true,
        featuredUntil: {
          lte: now,
          gte: since,
        },
      },
      select: { id: true, isFeatured: true, featuredUntil: true },
    });

    let reindexed = 0;
    for (const listing of listings) {
      if (isListingFeatured(listing, now)) continue;

      await this.prisma.listing.update({
        where: { id: listing.id },
        data: {
          isFeatured: false,
          featuredPlacement: null,
        },
      });

      await this.indexing.indexListing(listing.id);
      reindexed += 1;
    }
    return reindexed;
  }

  private async expireFeaturedStores(): Promise<number> {
    const now = new Date();
    const since = new Date(now);
    since.setDate(since.getDate() - 2);

    const stores = await this.prisma.store.findMany({
      where: {
        isFeatured: true,
        featuredUntil: {
          lte: now,
          gte: since,
        },
      },
      select: { id: true, isFeatured: true, featuredUntil: true },
    });

    let expired = 0;
    for (const store of stores) {
      if (isStoreFeatured(store, now)) continue;

      await this.prisma.store.update({
        where: { id: store.id },
        data: { isFeatured: false },
      });
      expired += 1;
    }
    return expired;
  }
}
