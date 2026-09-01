import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { AdminMessageFlagItem, RbacRole } from '@community-marketplace/types';
import {
  chatBanUserSchema,
  chatModerationSearchSchema,
  flagChatMessageSchema,
  messageFlagsQuerySchema,
  reportMessageSchema,
  resolveMessageFlagSchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { ApiUtilsService } from '../../../utils/api-utils.service';
import { mapChatMessage } from '../mappers/chat.mapper';
import { ChatAccessService } from './chat-access.service';

@Injectable()
export class ChatModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiUtils: ApiUtilsService,
    private readonly access: ChatAccessService,
    private readonly eventBus: EventBusService,
  ) {}

  async getThread(threadId: string, adminId: string, role: RbacRole) {
    await this.access.assertCanAccessThread(threadId, adminId, role);
    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      include: {
        buyer: true,
        seller: true,
        listing: { include: { images: { take: 1 } } },
        messages: { orderBy: { createdAt: 'asc' }, take: 200 },
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

  async reportMessage(reporterId: string, role: RbacRole, input: unknown) {
    const parsed = reportMessageSchema.parse(input);
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: parsed.messageId },
      include: { thread: true },
    });
    if (!message) throw new NotFoundException('Message not found');

    await this.access.assertCanAccessThread(message.threadId, reporterId, role);
    if (message.senderId === reporterId) {
      throw new ForbiddenException('You cannot report your own message');
    }

    const flag = await this.prisma.chatMessageFlag.create({
      data: {
        messageId: parsed.messageId,
        reporterId,
        reason: parsed.reason,
      },
    });

    this.eventBus.publish({
      type: 'chat.message_flagged',
      payload: {
        messageId: parsed.messageId,
        senderId: message.senderId,
        reason: parsed.reason,
      },
      timestamp: new Date(),
    });

    return flag;
  }

  async flagMessage(reporterId: string, messageId: string, input: unknown) {
    const parsed = flagChatMessageSchema.parse(input);
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');

    const flag = await this.prisma.chatMessageFlag.create({
      data: {
        messageId,
        reporterId,
        reason: parsed.reason,
        moderationNotes: parsed.moderationNotes,
      },
    });

    this.eventBus.publish({
      type: 'chat.message_flagged',
      payload: {
        messageId,
        senderId: message.senderId,
        reason: parsed.reason,
      },
      timestamp: new Date(),
    });

    return flag;
  }

  async listMessageFlags(input: unknown) {
    const parsed = messageFlagsQuerySchema.parse(input);
    const where = {
      ...(parsed.status ? { status: parsed.status } : { status: 'open' as const }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.chatMessageFlag.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parsed.page - 1) * parsed.limit,
        take: parsed.limit,
        include: {
          message: {
            include: {
              thread: {
                include: {
                  buyer: true,
                  seller: true,
                  listing: true,
                },
              },
            },
          },
          reporter: true,
        },
      }),
      this.prisma.chatMessageFlag.count({ where }),
    ]);

    const data: AdminMessageFlagItem[] = rows.map((row) => ({
      id: row.id,
      messageId: row.messageId,
      reporterId: row.reporterId ?? undefined,
      reason: row.reason,
      status: row.status,
      moderationNotes: row.moderationNotes ?? undefined,
      resolvedById: row.resolvedById ?? undefined,
      resolvedAt: row.resolvedAt?.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      messageContent: row.message.content,
      messageCreatedAt: row.message.createdAt.toISOString(),
      threadId: row.message.threadId,
      listingTitle: row.message.thread.listing.title,
      sellerId: row.message.thread.sellerId,
      sellerDisplayName: row.message.thread.seller.displayName ?? undefined,
      buyerId: row.message.thread.buyerId,
      buyerDisplayName: row.message.thread.buyer.displayName ?? undefined,
      reporterDisplayName: row.reporter?.displayName ?? undefined,
    }));

    return this.apiUtils.paginate(data, parsed.page, parsed.limit, total);
  }

  async resolveMessageFlag(flagId: string, adminId: string, input: unknown) {
    const parsed = resolveMessageFlagSchema.parse(input);
    const flag = await this.prisma.chatMessageFlag.findUnique({
      where: { id: flagId },
    });
    if (!flag) throw new NotFoundException('Report not found');

    return this.prisma.chatMessageFlag.update({
      where: { id: flagId },
      data: {
        status: parsed.status,
        moderationNotes: parsed.moderationNotes,
        resolvedById: adminId,
        resolvedAt: new Date(),
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
