import { Injectable } from '@nestjs/common';

import type { ChatPresenceStatus } from '@community-marketplace/types';

import { RedisCacheService } from '../../../libs/redis-cache.service';

@Injectable()
export class ChatPresenceService {
  private readonly localOnline = new Set<string>();

  constructor(private readonly cache: RedisCacheService) {}

  async setOnline(userId: string) {
    this.localOnline.add(userId);
    await this.cache.set(`chat:presence:${userId}`, 'online', 120);
  }

  async setOffline(userId: string) {
    this.localOnline.delete(userId);
    await this.cache.del(`chat:presence:${userId}`);
  }

  async getStatus(userId: string): Promise<ChatPresenceStatus> {
    const cached = await this.cache.get<string>(`chat:presence:${userId}`);
    if (cached === 'online' || this.localOnline.has(userId)) return 'online';
    return 'offline';
  }
}
