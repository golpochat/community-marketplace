import { Injectable, NotFoundException } from '@nestjs/common';

import type { ChatMessage, Conversation } from '@community-marketplace/types';

import { EventBusService } from '../../events/event-bus.service';
import { ConversationEntity } from './entities/conversation.entity';
import { MessageEntity } from './entities/message.entity';
import type { JoinConversationDto, SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly conversations = new Map<string, ConversationEntity>();
  private readonly messages = new Map<string, MessageEntity[]>();

  constructor(private readonly eventBus: EventBusService) {}

  joinConversation(userId: string, dto: JoinConversationDto): Conversation {
    const conversation = new ConversationEntity();
    conversation.id = `conv-${Date.now()}`;
    conversation.participantIds = [userId, dto.participantId];
    conversation.listingId = dto.listingId;
    conversation.unreadCounts = { [userId]: 0, [dto.participantId]: 0 };
    conversation.createdAt = new Date();
    conversation.updatedAt = new Date();

    this.conversations.set(conversation.id, conversation);
    this.messages.set(conversation.id, []);

    return this.toConversation(conversation);
  }

  getConversations(userId: string): Conversation[] {
    return [...this.conversations.values()]
      .filter((c) => c.participantIds.includes(userId))
      .map((c) => this.toConversation(c));
  }

  getMessages(conversationId: string): ChatMessage[] {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    return (this.messages.get(conversationId) ?? []).map((m) => this.toMessage(m));
  }

  sendMessage(senderId: string, dto: SendMessageDto): ChatMessage {
    const conversation = this.conversations.get(dto.conversationId);
    if (!conversation) {
      throw new NotFoundException(`Conversation ${dto.conversationId} not found`);
    }

    const message = new MessageEntity();
    message.id = `msg-${Date.now()}`;
    message.conversationId = dto.conversationId;
    message.senderId = senderId;
    message.recipientId = dto.recipientId;
    message.listingId = dto.listingId;
    message.type = dto.type ?? 'text';
    message.content = dto.content;
    message.status = 'sent';
    message.createdAt = new Date();
    message.updatedAt = new Date();

    const existing = this.messages.get(dto.conversationId) ?? [];
    this.messages.set(dto.conversationId, [...existing, message]);

    conversation.lastMessageId = message.id;
    conversation.unreadCounts[dto.recipientId] =
      (conversation.unreadCounts[dto.recipientId] ?? 0) + 1;
    conversation.updatedAt = new Date();

    this.eventBus.publish({
      type: 'chat.message_sent',
      payload: { messageId: message.id, conversationId: dto.conversationId },
      timestamp: new Date(),
    });

    return this.toMessage(message);
  }

  markAsRead(userId: string, conversationId: string): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }
    conversation.unreadCounts[userId] = 0;
    conversation.updatedAt = new Date();
  }

  private toConversation(entity: ConversationEntity): Conversation {
    const messages = this.messages.get(entity.id) ?? [];
    const lastMessage = messages.at(-1);

    return {
      id: entity.id,
      participantIds: entity.participantIds,
      listingId: entity.listingId,
      lastMessage: lastMessage ? this.toMessage(lastMessage) : undefined,
      unreadCount: Object.values(entity.unreadCounts).reduce<number>(
        (sum, n) => sum + (n as number),
        0,
      ),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toMessage(entity: MessageEntity): ChatMessage {
    return {
      id: entity.id,
      conversationId: entity.conversationId,
      senderId: entity.senderId,
      recipientId: entity.recipientId,
      listingId: entity.listingId,
      type: entity.type,
      content: entity.content,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
