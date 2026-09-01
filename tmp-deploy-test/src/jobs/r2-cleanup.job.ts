import { Injectable, OnModuleInit } from '@nestjs/common';

import { JobQueueService } from './job-queue.service';
import { LoggerLib } from '../libs/logger.lib';

/**
 * Scheduled cleanup for orphaned R2 objects (runs via BullMQ nightly).
 */
@Injectable()
export class R2CleanupJob implements OnModuleInit {
  constructor(
    private readonly jobs: JobQueueService,
    private readonly logger: LoggerLib,
  ) {}

  onModuleInit() {
    this.jobs.registerHandler('storage.cleanup_orphans', async () => {
      this.logger.log('R2CleanupJob', 'Orphan cleanup job executed (stub — wire S3 list/delete)');
      // Production: list keys per prefix, compare DB references, delete orphans older than 24h
    });
  }
}
