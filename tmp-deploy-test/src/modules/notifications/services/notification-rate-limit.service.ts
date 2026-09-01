import { Injectable } from '@nestjs/common';

import { RedisCacheService } from '../../../libs/redis-cache.service';

@Injectable()
export class NotificationRateLimitService {
  private readonly memory = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly cache: RedisCacheService) {}

  private async increment(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const now = Date.now();
    const cacheKey = `notif:ratelimit:${key}`;

    const cached = await this.cache.get<{ count: number; resetAt: number }>(cacheKey);
    if (cached) {
      if (cached.resetAt > now) {
        if (cached.count >= limit) return false;
        cached.count += 1;
        await this.cache.set(cacheKey, cached, Math.ceil((cached.resetAt - now) / 1000));
        return true;
      }
    }

    const mem = this.memory.get(key);
    if (mem && mem.resetAt > now) {
      if (mem.count >= limit) return false;
      mem.count += 1;
      return true;
    }

    const resetAt = now + windowSeconds * 1000;
    const next = { count: 1, resetAt };
    this.memory.set(key, next);
    await this.cache.set(cacheKey, next, windowSeconds);
    return true;
  }

  async checkUserLimit(userId: string, limit = 50, windowSeconds = 3600): Promise<boolean> {
    return this.increment(`user:${userId}`, limit, windowSeconds);
  }

  async checkProviderLimit(providerId: string, limit = 200, windowSeconds = 60): Promise<boolean> {
    return this.increment(`provider:${providerId}`, limit, windowSeconds);
  }
}
