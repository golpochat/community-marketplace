import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { JobQueueService } from '../../../jobs/job-queue.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { SearchIndexingService } from '../../search/services/search-indexing.service';
import { PrismaService } from '../../../database/prisma.service';
import { isListingBoosted } from '../lib/boost.lib';

const BOOST_EXPIRY_INTERVAL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class BoostExpiryJobService implements OnModuleInit, OnModuleDestroy {
  private intervalTimer?: NodeJS.Timeout;

  constructor(
    private readonly jobQueue: JobQueueService,
    private readonly prisma: PrismaService,
    private readonly indexing: SearchIndexingService,
    private readonly logger: LoggerLib,
  ) {}

  onModuleInit() {
    this.jobQueue.registerHandler('monetization.boost_expiry', async () => {
      const count = await this.expireBoostRankings();
      this.logger.log('BoostExpiryJob', `Reindexed ${count} listings after boost expiry`);
    });

    void this.jobQueue.enqueue({ name: 'monetization.boost_expiry' });
    this.intervalTimer = setInterval(() => {
      void this.jobQueue.enqueue({ name: 'monetization.boost_expiry' });
    }, BOOST_EXPIRY_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
  }

  private async expireBoostRankings(): Promise<number> {
    const now = new Date();
    const since = new Date(now);
    since.setDate(since.getDate() - 2);

    const listings = await this.prisma.listing.findMany({
      where: {
        boostedUntil: {
          lte: now,
          gte: since,
        },
      },
      select: { id: true, boostedUntil: true },
    });

    let reindexed = 0;
    for (const listing of listings) {
      if (isListingBoosted(listing.boostedUntil, now)) continue;
      await this.indexing.indexListing(listing.id);
      reindexed += 1;
    }
    return reindexed;
  }
}
