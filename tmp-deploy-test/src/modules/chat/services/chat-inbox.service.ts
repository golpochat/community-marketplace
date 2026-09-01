import { Injectable } from '@nestjs/common';

import type { RbacRole } from '@community-marketplace/types';
import { chatInboxQuerySchema } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { RedisCacheService } from '../../../libs/redis-cache.service';
import { mapChatMessage, mapInboxItem, threadInclude } from '../mappers/chat.mapper';

@Injectable()
export class ChatInboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async listInbox(userId: string, role: RbacRole, input: unknown) {
    const query = chatInboxQuerySchema.parse(input);
    const cacheKey = `chat:inbox:${userId}:${query.page}:${query.limit}:${query.includeArchived}`;

    const cached = await this.cache.get<{
      data: ReturnType<typeof mapInboxItem>[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(cacheKey);
    if (cached) return cached;

    const where = {
      OR: [{ buyerId: userId }, { sellerId: userId }],
      ...(query.includeArchived
        ? {}
        : {
            NOT: {
              OR: [
                { buyerId: userId, archivedByBuyer: true },
                { sellerId: userId, archivedBySeller: true },
              ],
            },
          }),
    };

    const [threads, total] = await Promise.all([
      this.prisma.chatThread.findMany({
        where,
        include: threadInclude,
        orderBy: { lastMessageAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.chatThread.count({ where }),
    ]);

    const data = await Promise.all(
      threads.map(async (thread) => {
        const lastMsg = await this.prisma.chatMessage.findFirst({
          where: { threadId: thread.id },
          orderBy: { createdAt: 'desc' },
        });
        const unreadCount = await this.prisma.chatMessage.count({
          where: {
            threadId: thread.id,
            NOT: { readBy: { has: userId } },
            senderId: { not: userId },
          },
        });

        return mapInboxItem(
          thread,
          lastMsg ? mapChatMessage(lastMsg) : undefined,
          unreadCount,
          userId,
        );
      }),
    );

    const result = {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };

    await this.cache.set(cacheKey, result, 30);
    return result;
  }

  async invalidateInbox(userId: string) {
    await this.cache.del(`chat:inbox:${userId}:1:20:false`);
    await this.cache.del(`chat:inbox:${userId}:1:20:true`);
  }
}
