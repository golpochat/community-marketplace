import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { JobQueueService } from '../../../jobs/job-queue.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { BuyerWalletService } from './buyer-wallet.service';
import { CashbackGrantsService } from './cashback-grants.service';

const CASHBACK_JOB_INTERVAL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class CashbackJobsService implements OnModuleInit, OnModuleDestroy {
  private intervalTimer?: NodeJS.Timeout;

  constructor(
    private readonly jobQueue: JobQueueService,
    private readonly grants: CashbackGrantsService,
    private readonly wallet: BuyerWalletService,
    private readonly logger: LoggerLib,
  ) {}

  onModuleInit() {
    this.jobQueue.registerHandler('monetization.cashback_unlock', async () => {
      const unlocked = await this.grants.processUnlocks();
      const expired = await this.wallet.processExpiries();
      this.logger.log(
        'CashbackJobs',
        `Processed cashback: ${unlocked} unlocked, ${expired} expired`,
      );
    });

    void this.jobQueue.enqueue({ name: 'monetization.cashback_unlock' });
    this.intervalTimer = setInterval(() => {
      void this.jobQueue.enqueue({ name: 'monetization.cashback_unlock' });
    }, CASHBACK_JOB_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
  }
}
