import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, type Job as BullJob } from 'bullmq';

import { LoggerLib } from '../libs/logger.lib';

export interface QueueJob {
  name: string;
  payload?: Record<string, unknown>;
}

type JobHandler = (payload: Record<string, unknown>) => Promise<void>;

@Injectable()
export class JobQueueService implements OnModuleInit, OnModuleDestroy {
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private readonly handlers = new Map<string, JobHandler>();
  private readonly pendingLocal: QueueJob[] = [];

  constructor(private readonly logger: LoggerLib) {}

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.log('JobQueueService', 'REDIS_URL not set — jobs run inline');
      return;
    }

    const connection = { url: redisUrl };
    this.queue = new Queue('community-marketplace', { connection });
    this.worker = new Worker(
      'community-marketplace',
      async (job: BullJob) => {
        const handler = this.handlers.get(job.name);
        if (!handler) {
          this.logger.log('JobQueueService', `No handler for job ${job.name}`);
          return;
        }
        await handler((job.data ?? {}) as Record<string, unknown>);
      },
      { connection },
    );

    this.logger.log('JobQueueService', 'BullMQ worker started');
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }

  registerHandler(name: string, handler: JobHandler) {
    this.handlers.set(name, handler);
    void this.flushPending(name);
  }

  async enqueue(job: QueueJob): Promise<void> {
    if (this.queue) {
      await this.queue.add(job.name, job.payload ?? {}, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
      return;
    }

    const handler = this.handlers.get(job.name);
    if (handler) {
      void Promise.resolve(handler(job.payload ?? {})).catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.log('JobQueueService', `Inline job ${job.name} failed: ${message}`);
      });
      return;
    }

    this.pendingLocal.push(job);
    this.logger.log('JobQueueService', `Queued locally: ${job.name}`);
  }

  private async flushPending(name: string) {
    const handler = this.handlers.get(name);
    if (!handler) return;
    const jobs = this.pendingLocal.filter((j) => j.name === name);
    for (const job of jobs) {
      await handler(job.payload ?? {});
    }
    this.pendingLocal.splice(
      0,
      this.pendingLocal.length,
      ...this.pendingLocal.filter((j) => j.name !== name),
    );
  }
}
