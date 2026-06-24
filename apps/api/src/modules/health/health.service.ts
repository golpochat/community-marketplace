import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { JobQueueService } from '../../jobs/job-queue.service';
import { RedisCacheService } from '../../libs/redis-cache.service';
import { MeilisearchService } from '../search/services/meilisearch.service';

export interface HealthComponentStatus {
  status: 'up' | 'down' | 'degraded';
  latencyMs?: number;
  message?: string;
}

export interface ReadinessReport {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  checks: Record<string, HealthComponentStatus>;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisCacheService,
    private readonly meili: MeilisearchService,
    private readonly jobs: JobQueueService,
  ) {}

  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  async ready(): Promise<ReadinessReport> {
    const checks: Record<string, HealthComponentStatus> = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      meilisearch: await this.checkMeilisearch(),
    };

    const statuses = Object.values(checks).map((c) => c.status);
    const status = statuses.every((s) => s === 'up')
      ? 'ok'
      : statuses.some((s) => s === 'down')
        ? 'error'
        : 'degraded';

    return { status, timestamp: new Date().toISOString(), checks };
  }

  async queues() {
    return this.jobs.getQueueStats();
  }

  private async checkDatabase(): Promise<HealthComponentStatus> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { status: 'down', message };
    }
  }

  private async checkRedis(): Promise<HealthComponentStatus> {
    const start = Date.now();
    const ok = await this.redis.ping();
    if (!ok) {
      return { status: process.env.REDIS_URL ? 'down' : 'degraded', message: 'Redis unavailable' };
    }
    return { status: 'up', latencyMs: Date.now() - start };
  }

  private async checkMeilisearch(): Promise<HealthComponentStatus> {
    const start = Date.now();
    const result = await this.meili.healthCheck();
    return {
      status: result.healthy ? 'up' : process.env.MEILISEARCH_HOST ? 'degraded' : 'degraded',
      latencyMs: Date.now() - start,
      message: result.healthy ? undefined : 'Meilisearch unavailable',
    };
  }
}
