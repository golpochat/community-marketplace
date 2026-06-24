import { Injectable, NotFoundException } from '@nestjs/common';

import type { RbacRole } from '@community-marketplace/types';
import {
  chatBanUserSchema,
  chatModerationSearchSchema,
  flagChatMessageSchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { ApiUtilsService } from '../../../utils/api-utils.service';
import { mapChatMessage } from '../mappers/chat.mapper';
import { ChatAccessService } from './chat-access.service';

@Injectable()
export class ChatModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiUtils: ApiUtilsService,
    private readonly access: ChatAccessService,
  ) {}

  async getThread(threadId: string, adminId: string, role: RbacRole) {
    await this.access.assertCanAccessThread(threadId, adminId, role);
    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      include: {
        buyer: true,
        seller: true,
        listing: { include: { images: { take: 1 } } },
        messages: { orderBy: { createdAt: 'asc' }, take: 100 },
      },
    });
    return thread;
  }

  async searchMessages(input: unknown) {
    const parsed = chatModerationSearchSchema.parse(input);
    const where = {
      content: { contains: parsed.q, mode: 'insensitive' as const },
      deletedAt: null,
    };

    const [rows, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parsed.page - 1) * parsed.limit,
        take: parsed.limit,
        include: { thread: true, sender: true },
      }),
      this.prisma.chatMessage.count({ where }),
    ]);

    return this.apiUtils.paginate(
      rows.map((row) => ({
        ...mapChatMessage(row),
        sender: { id: row.sender.id, email: row.sender.email },
        threadId: row.threadId,
      })),
      parsed.page,
      parsed.limit,
      total,
    );
  }

  async flagMessage(reporterId: string, messageId: string, input: unknown) {
    const parsed = flagChatMessageSchema.parse(input);
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');

    return this.prisma.chatMessageFlag.create({
      data: {
        messageId,
        reporterId,
        reason: parsed.reason,
        moderationNotes: parsed.moderationNotes,
      },
    });
  }

  async banUser(adminId: string, input: unknown) {
    const parsed = chatBanUserSchema.parse(input);
    return this.prisma.chatBan.create({
      data: {
        userId: parsed.userId,
        bannedById: adminId,
        reason: parsed.reason,
        moderationNotes: parsed.moderationNotes,
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
      },
    });
  }
}
