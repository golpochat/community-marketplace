import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, type Job as BullJob } from 'bullmq';

import {
  assertRedisConfiguredForProduction,
  assertRedisReachableForProduction,
  probeRedisUrl,
} from '../libs/redis-connection.lib';
import { LoggerLib } from '../libs/logger.lib';

export interface DomainEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export type EventDelivery = 'sync' | 'durable';

export interface SubscribeOptions {
  delivery?: EventDelivery;
}

type EventHandler = (event: DomainEvent) => void | Promise<void>;

const DOMAIN_EVENTS_QUEUE = 'domain-events';
const DOMAIN_EVENT_JOB = 'domain.event';

interface DurableEventPayload {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

@Injectable()
export class EventBusService implements OnModuleInit, OnModuleDestroy {
  private readonly syncHandlers = new Map<string, EventHandler[]>();
  private readonly durableHandlers = new Map<string, EventHandler[]>();
  private queue: Queue | null = null;
  private worker: Worker | null = null;

  constructor(private readonly logger: LoggerLib) {}

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    assertRedisConfiguredForProduction('EventBusService', redisUrl);
    if (!redisUrl) {
      this.logger.log('EventBusService', 'REDIS_URL not set — durable events run inline');
      return;
    }

    const redisAvailable = await probeRedisUrl(redisUrl);
    assertRedisReachableForProduction('EventBusService', redisAvailable);
    if (!redisAvailable) {
      this.logger.log(
        'EventBusService',
        `Redis unavailable at ${redisUrl} — durable events run inline`,
      );
      return;
    }

    const connection = { url: redisUrl };
    this.queue = new Queue(DOMAIN_EVENTS_QUEUE, { connection });

    const mode = process.env.BULLMQ_MODE ?? 'both';
    if (mode === 'worker') {
      this.logger.log('EventBusService', 'Producer only for domain events (BULLMQ_MODE=worker)');
      return;
    }

    this.worker = new Worker(
      DOMAIN_EVENTS_QUEUE,
      async (job: BullJob) => {
        await this.dispatchDurable(deserializeEvent(job.data as DurableEventPayload));
      },
      { connection },
    );
    this.logger.log('EventBusService', `Domain-events worker started (mode=${mode})`);
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }

  subscribe(type: string, handler: EventHandler, options?: SubscribeOptions) {
    const delivery = options?.delivery ?? 'durable';
    const target = delivery === 'sync' ? this.syncHandlers : this.durableHandlers;
    const existing = target.get(type) ?? [];
    target.set(type, [...existing, handler]);
  }

  publish(event: DomainEvent) {
    this.logger.log('EventBus', `Publishing ${event.type}`);
    void this.dispatch(this.syncHandlers, event);

    if (this.queue) {
      void this.queue
        .add(DOMAIN_EVENT_JOB, serializeEvent(event), {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error('EventBus', `Failed to enqueue ${event.type}: ${message}`);
        });
      return;
    }

    void this.dispatch(this.durableHandlers, event);
  }

  private async dispatch(handlers: Map<string, EventHandler[]>, event: DomainEvent) {
    const list = handlers.get(event.type) ?? [];
    for (const handler of list) {
      try {
        await handler(event);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const trace = error instanceof Error ? error.stack : undefined;
        this.logger.error('EventBus', `Handler failed for ${event.type}: ${message}`, trace);
      }
    }
  }

  private async dispatchDurable(event: DomainEvent) {
    const list = this.durableHandlers.get(event.type) ?? [];
    if (list.length === 0) return;

    const errors: unknown[] = [];
    for (const handler of list) {
      try {
        await handler(event);
      } catch (error) {
        errors.push(error);
        const message = error instanceof Error ? error.message : String(error);
        const trace = error instanceof Error ? error.stack : undefined;
        this.logger.error('EventBus', `Durable handler failed for ${event.type}: ${message}`, trace);
      }
    }

    if (errors.length === list.length) {
      throw errors[0];
    }
  }
}

function serializeEvent(event: DomainEvent): DurableEventPayload {
  return {
    type: event.type,
    payload: event.payload,
    timestamp: event.timestamp.toISOString(),
  };
}

function deserializeEvent(data: DurableEventPayload): DomainEvent {
  return {
    type: data.type,
    payload: data.payload ?? {},
    timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
  };
}
