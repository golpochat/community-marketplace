import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type Redis from 'ioredis';

import { LoggerLib } from '../libs/logger.lib';
import { createRedisClient } from './redis-connection.lib';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;

  private readonly memory = new Map<string, { value: string; expiresAt: number }>();

  constructor(private readonly logger: LoggerLib) {}

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.log('RedisCacheService', 'REDIS_URL not set — using in-memory cache');
      return;
    }

    const client = await createRedisClient(redisUrl);
    if (!client) {
      this.logger.log(
        'RedisCacheService',
        `Redis unavailable at ${redisUrl} — using in-memory cache`,
      );
      return;
    }

    client.on('error', (error: Error) => {
      this.logger.error('RedisCacheService', `Redis error: ${error.message}`);
    });

    this.client = client;
    this.logger.log('RedisCacheService', 'Connected to Redis');
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = this.client
      ? await this.client.get(key)
      : this.readMemory(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    const serialized = JSON.stringify(value);
    if (this.client) {
      if (ttlSeconds > 0) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
      return;
    }
    this.memory.set(key, {
      value: serialized,
      expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : Number.MAX_SAFE_INTEGER,
    });
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      await this.client.del(key);
      return;
    }
    this.memory.delete(key);
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  private readMemory(key: string): string | null {
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return entry.value;
  }
}
