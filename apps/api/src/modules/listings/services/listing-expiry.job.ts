import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { JobQueueService } from '../../../jobs/job-queue.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { ListingLifecycleService } from './listing-lifecycle.service';

const EXPIRY_INTERVAL_MS = 15 * 60 * 1000;

@Injectable()
export class ListingExpiryJobService implements OnModuleInit, OnModuleDestroy {
  private intervalTimer?: NodeJS.Timeout;

  constructor(
    private readonly jobQueue: JobQueueService,
    private readonly lifecycle: ListingLifecycleService,
    private readonly logger: LoggerLib,
  ) {}

  onModuleInit() {
    this.jobQueue.registerHandler('listings.expire_due', async () => {
      const expired = await this.lifecycle.expireDueListings();
      const warned = await this.lifecycle.warnExpiringSoon();
      this.logger.log(
        'ListingExpiryJob',
        `Processed expiry: ${expired} expired, ${warned} expiring-soon warnings`,
      );
    });

    void this.jobQueue.enqueue({ name: 'listings.expire_due' });

    this.intervalTimer = setInterval(() => {
      void this.jobQueue.enqueue({ name: 'listings.expire_due' });
    }, EXPIRY_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
  }
}
