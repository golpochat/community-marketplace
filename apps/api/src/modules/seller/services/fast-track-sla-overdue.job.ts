import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { JobQueueService } from '../../../jobs/job-queue.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';

const FAST_TRACK_SLA_CHECK_INTERVAL_MS = 15 * 60 * 1000;

@Injectable()
export class FastTrackSlaOverdueJobService implements OnModuleInit, OnModuleDestroy {
  private intervalTimer?: NodeJS.Timeout;

  constructor(
    private readonly jobQueue: JobQueueService,
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly logger: LoggerLib,
  ) {}

  onModuleInit() {
    this.jobQueue.registerHandler('seller.fast_track_sla_overdue', async () => {
      const count = await this.notifyOverdueCases();
      if (count > 0) {
        this.logger.log('FastTrackSlaOverdueJob', `Notified staff for ${count} overdue fast-track cases`);
      }
    });

    void this.jobQueue.enqueue({ name: 'seller.fast_track_sla_overdue' });
    this.intervalTimer = setInterval(() => {
      void this.jobQueue.enqueue({ name: 'seller.fast_track_sla_overdue' });
    }, FAST_TRACK_SLA_CHECK_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
  }

  private async notifyOverdueCases(): Promise<number> {
    const now = new Date();
    const overdue = await this.prisma.sellerVerificationRequest.findMany({
      where: {
        status: 'pending',
        priority: true,
        slaDueAt: { lt: now },
        slaOverdueNotifiedAt: null,
        user: { verificationRequestedAt: { not: null } },
      },
      include: {
        user: { select: { displayName: true, email: true } },
      },
      take: 25,
    });

    for (const row of overdue) {
      const name = row.user.displayName ?? row.user.email ?? 'A seller';
      this.eventBus.publish({
        type: 'seller.verification_sla_overdue',
        payload: {
          userId: row.userId,
          verificationId: row.id,
          reviewDueAt: row.slaDueAt?.toISOString(),
          sellerName: name,
        },
        timestamp: now,
      });

      await this.prisma.sellerVerificationRequest.update({
        where: { id: row.id },
        data: { slaOverdueNotifiedAt: now },
      });
    }

    return overdue.length;
  }
}
