import { Injectable, OnModuleInit } from '@nestjs/common';

import { JobQueueService } from '../../../jobs/job-queue.service';
import { ModerationActionsService } from './moderation-actions.service';

@Injectable()
export class ModerationSuspensionJobService implements OnModuleInit {
  constructor(
    private readonly jobQueue: JobQueueService,
    private readonly actions: ModerationActionsService,
  ) {}

  onModuleInit() {
    this.jobQueue.registerHandler('moderation.lift_suspension', async (payload) => {
      const userId = payload.userId as string;
      const actionId = payload.actionId as string;
      if (userId && actionId) {
        await this.actions.liftSuspension(userId, actionId);
      }
    });
  }
}
