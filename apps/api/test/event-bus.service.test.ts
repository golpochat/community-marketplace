import { afterEach, describe, expect, it } from 'vitest';

import { EventBusService } from '../src/events/event-bus.service';
import { JobQueueService } from '../src/jobs/job-queue.service';
import { RedisCacheService } from '../src/libs/redis-cache.service';
import { LoggerLib } from '../src/libs/logger.lib';

describe('durable EventBus and production Redis', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousRedis = process.env.REDIS_URL;

  afterEach(() => {
    process.env.NODE_ENV = previousNodeEnv;
    if (previousRedis === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = previousRedis;
  });

  it('runs durable handlers inline when Redis is unset and isolates failures', async () => {
    delete process.env.REDIS_URL;
    process.env.NODE_ENV = 'test';

    const bus = new EventBusService(new LoggerLib());
    await bus.onModuleInit();

    const seen: string[] = [];
    bus.subscribe('listing.created', () => {
      throw new Error('boom');
    });
    bus.subscribe('listing.created', (event) => {
      seen.push(event.type);
    });
    bus.subscribe(
      'chat.message_sent',
      (event) => {
        seen.push(event.type);
      },
      { delivery: 'sync' },
    );

    bus.publish({ type: 'listing.created', payload: { listingId: '1' }, timestamp: new Date() });
    bus.publish({ type: 'chat.message_sent', payload: { messageId: 'm1' }, timestamp: new Date() });

    expect(seen).toEqual(['listing.created', 'chat.message_sent']);
    await bus.onModuleDestroy();
  });

  it('refuses EventBus, jobs, and cache fallbacks in production without Redis', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.REDIS_URL;

    const logger = new LoggerLib();
    await expect(new EventBusService(logger).onModuleInit()).rejects.toThrow(/REDIS_URL is required in production/);
    await expect(new JobQueueService(logger).onModuleInit()).rejects.toThrow(/REDIS_URL is required in production/);
    await expect(new RedisCacheService(logger).onModuleInit()).rejects.toThrow(/REDIS_URL is required in production/);
  });
});
