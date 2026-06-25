import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, type Job as BullJob } from 'bullmq';
import { Gauge } from 'prom-client';

import { LoggerLib } from '../libs/logger.lib';
import { probeRedisUrl } from '../libs/redis-connection.lib';
import { metricsRegistry } from '../modules/metrics/metrics.registry';

export interface QueueJob {
  name: string;
  payload?: Record<string, unknown>;
}

type JobHandler = (payload: Record<string, unknown>) => Promise<void>;

type BullmqMode = 'producer' | 'worker' | 'both';

const QUEUE_NAME = 'community-marketplace';

@Injectable()
export class JobQueueService implements OnModuleInit, OnModuleDestroy {
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private readonly handlers = new Map<string, JobHandler>();
  private readonly pendingLocal: QueueJob[] = [];
  private readonly mode: BullmqMode;
  private queueWaitingGauge: Gauge<string> | null = null;

  constructor(private readonly logger: LoggerLib) {
    const raw = process.env.BULLMQ_MODE ?? 'both';
    this.mode = raw === 'producer' || raw === 'worker' ? raw : 'both';
  }

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.log('JobQueueService', 'REDIS_URL not set — jobs run inline');
      return;
    }

    const redisAvailable = await probeRedisUrl(redisUrl);
    if (!redisAvailable) {
      this.logger.log(
        'JobQueueService',
        `Redis unavailable at ${redisUrl} — jobs run inline`,
      );
      return;
    }

    const connection = { url: redisUrl };

    if (this.mode === 'producer' || this.mode === 'both') {
      this.queue = new Queue(QUEUE_NAME, { connection });
    }

    if (this.mode === 'worker' || this.mode === 'both') {
      this.worker = new Worker(
        QUEUE_NAME,
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
      this.logger.log('JobQueueService', `BullMQ worker started (mode=${this.mode})`);
    } else {
      this.logger.log('JobQueueService', `BullMQ producer only (mode=${this.mode})`);
    }

    this.queueWaitingGauge = new Gauge({
      name: 'bullmq_queue_waiting',
      help: 'Number of jobs waiting in the queue',
      registers: [metricsRegistry],
    });
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
        this.logger.error('JobQueueService', `Inline job ${job.name} failed: ${message}`);
      });
      return;
    }

    this.pendingLocal.push(job);
    this.logger.log('JobQueueService', `Queued locally: ${job.name}`);
  }

  async getQueueStats() {
    if (!this.queue) {
      return { connected: false, counts: null };
    }

    const counts = await this.queue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused',
    );
    this.queueWaitingGauge?.set(counts.waiting ?? 0);

    return { connected: true, queue: QUEUE_NAME, counts };
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
