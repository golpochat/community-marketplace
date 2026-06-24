import { Injectable, OnModuleInit } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../database/prisma.service';
import { mapChatMessage } from '../mappers/chat.mapper';
import { ChatRealtimeService } from '../services/chat-realtime.service';

@Injectable()
export class ChatRealtimeListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly realtime: ChatRealtimeService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('chat.message_sent', (event) => {
      void this.onMessage(event.payload);
    });
    this.eventBus.subscribe('chat.system_message', (event) => {
      void this.onMessage(event.payload);
    });
    this.eventBus.subscribe('chat.messages_read', (event) => {
      const payload = event.payload;
      this.realtime.emitReadReceipt(
        payload.threadId as string,
        payload.readerId as string,
        payload.messageIds as string[],
      );
    });
    this.eventBus.subscribe('chat.message_updated', (event) => {
      void this.onMessageUpdated(event.payload);
    });
    this.eventBus.subscribe('chat.message_deleted', (event) => {
      this.realtime.emitToThread(event.payload.threadId as string, 'message_deleted', {
        messageId: event.payload.messageId,
        threadId: event.payload.threadId,
      });
    });
  }

  private async onMessage(payload: Record<string, unknown>) {
    const messageId = payload.messageId as string;
    const threadId = payload.threadId as string;
    const row = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!row) return;
    this.realtime.emitMessage(threadId, mapChatMessage(row));
  }

  private async onMessageUpdated(payload: Record<string, unknown>) {
    const messageId = payload.messageId as string;
    const threadId = payload.threadId as string;
    const row = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!row) return;
    this.realtime.emitToThread(threadId, 'message_updated', mapChatMessage(row));
  }
}
