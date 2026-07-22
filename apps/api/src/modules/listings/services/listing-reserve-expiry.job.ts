import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { JobQueueService } from '../../../jobs/job-queue.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { ListingReserveService } from './listing-reserve.service';

const INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class ListingReserveExpiryJobService implements OnModuleInit, OnModuleDestroy {
  private intervalTimer?: NodeJS.Timeout;

  constructor(
    private readonly jobQueue: JobQueueService,
    private readonly reserves: ListingReserveService,
    private readonly logger: LoggerLib,
  ) {}

  onModuleInit() {
    this.jobQueue.registerHandler('listings.expire_reserves', async () => {
      const result = await this.reserves.expireDue();
      this.logger.log(
        'ListingReserveExpiryJob',
        `Expired reserves: ${result.pending} pending, ${result.active} active`,
      );
      const reminders = await this.reserves.sendReminders();
      if (reminders.holdEnding > 0 || reminders.pendingSeller > 0) {
        this.logger.log(
          'ListingReserveExpiryJob',
          `Reserve reminders: ${reminders.holdEnding} hold ending, ${reminders.pendingSeller} pending seller`,
        );
      }
    });

    void this.jobQueue.enqueue({ name: 'listings.expire_reserves' });
    this.intervalTimer = setInterval(() => {
      void this.jobQueue.enqueue({ name: 'listings.expire_reserves' });
    }, INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
  }
}
