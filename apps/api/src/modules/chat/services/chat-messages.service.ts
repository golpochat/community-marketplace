import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ChatMessage, RbacRole } from '@community-marketplace/types';
import {
  chatMessagesQuerySchema,
  editChatMessageSchema,
  markMessagesReadSchema,
  sendChatMessageSchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { mapChatMessage } from '../mappers/chat.mapper';
import { ChatAccessService } from './chat-access.service';
import { ChatInboxService } from './chat-inbox.service';

function messagePreview(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= 120) return trimmed;
  return `${trimmed.slice(0, 117)}...`;
}

@Injectable()
export class ChatMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ChatAccessService,
    private readonly eventBus: EventBusService,
    private readonly inbox: ChatInboxService,
  ) {}

  async list(threadId: string, userId: string, role: RbacRole, input: unknown) {
    await this.access.assertCanAccessThread(threadId, userId, role);
    const query = chatMessagesQuerySchema.parse({ ...(input as object), threadId });

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        threadId,
        ...(query.before ? { createdAt: { lt: new Date(query.before) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    const total = await this.prisma.chatMessage.count({ where: { threadId } });

    return {
      data: messages.reverse().map(mapChatMessage),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async send(senderId: string, role: RbacRole, input: unknown): Promise<ChatMessage> {
    await this.access.assertCanSendMessage(senderId, role);
    const parsed = sendChatMessageSchema.parse(input);
    const thread = await this.access.assertCanAccessThread(
      parsed.threadId,
      senderId,
      role,
    );

    if (parsed.messageType === 'system') {
      throw new ForbiddenException('System messages cannot be sent by users');
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({
        data: {
          threadId: parsed.threadId,
          senderId,
          content: parsed.content,
          messageType: parsed.messageType,
          attachmentUrl: parsed.attachmentUrl,
          readBy: [senderId],
        },
      });

      await tx.chatThread.update({
        where: { id: parsed.threadId },
        data: {
          lastMessageAt: message.createdAt,
          lastMessagePreview: messagePreview(parsed.content),
        },
      });

      return message;
    });

    const recipientId =
      thread.buyerId === senderId ? thread.sellerId : thread.buyerId;

    await this.inbox.invalidateInbox(thread.buyerId);
    await this.inbox.invalidateInbox(thread.sellerId);

    this.eventBus.publish({
      type: 'chat.message_sent',
      payload: {
        messageId: row.id,
        threadId: parsed.threadId,
        senderId,
        recipientId,
      },
      timestamp: new Date(),
    });

    return mapChatMessage(row);
  }

  async sendSystemMessage(threadId: string, content: string, senderId: string) {
    const row = await this.prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({
        data: {
          threadId,
          senderId,
          content,
          messageType: 'system',
          readBy: [],
        },
      });
      await tx.chatThread.update({
        where: { id: threadId },
        data: {
          lastMessageAt: message.createdAt,
          lastMessagePreview: messagePreview(content),
        },
      });
      return message;
    });

    this.eventBus.publish({
      type: 'chat.system_message',
      payload: { messageId: row.id, threadId },
      timestamp: new Date(),
    });

    return mapChatMessage(row);
  }

  async edit(
    messageId: string,
    userId: string,
    role: RbacRole,
    input: unknown,
  ): Promise<ChatMessage> {
    const parsed = editChatMessageSchema.parse(input);
    const message = await this.getEditableMessage(messageId, userId, role);

    const row = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { content: parsed.content, editedAt: new Date() },
    });

    this.eventBus.publish({
      type: 'chat.message_updated',
      payload: { messageId, threadId: message.threadId },
      timestamp: new Date(),
    });

    return mapChatMessage(row);
  }

  async remove(messageId: string, userId: string, role: RbacRole): Promise<void> {
    const message = await this.getEditableMessage(messageId, userId, role);

    await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: '' },
    });

    this.eventBus.publish({
      type: 'chat.message_deleted',
      payload: { messageId, threadId: message.threadId },
      timestamp: new Date(),
    });
  }

  async markRead(userId: string, role: RbacRole, input: unknown) {
    const parsed = markMessagesReadSchema.parse(input);
    await this.access.assertCanAccessThread(parsed.threadId, userId, role);

    const messages = parsed.messageIds?.length
      ? await this.prisma.chatMessage.findMany({
          where: { threadId: parsed.threadId, id: { in: parsed.messageIds } },
        })
      : await this.prisma.chatMessage.findMany({
          where: {
            threadId: parsed.threadId,
            NOT: { readBy: { has: userId } },
          },
        });

    const updatedIds: string[] = [];
    for (const msg of messages) {
      if (msg.readBy.includes(userId)) continue;
      await this.prisma.chatMessage.update({
        where: { id: msg.id },
        data: { readBy: { push: userId } },
      });
      updatedIds.push(msg.id);
    }

    if (updatedIds.length) {
      this.eventBus.publish({
        type: 'chat.messages_read',
        payload: {
          threadId: parsed.threadId,
          readerId: userId,
          messageIds: updatedIds,
        },
        timestamp: new Date(),
      });
    }

    return { threadId: parsed.threadId, messageIds: updatedIds };
  }

  private async getEditableMessage(
    messageId: string,
    userId: string,
    role: RbacRole,
  ) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException(`Message ${messageId} not found`);
    if (message.messageType === 'system') {
      throw new BadRequestException('System messages cannot be modified');
    }

    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (!isAdmin && message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    return message;
  }
}
