import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';

import type {
  ChatMessage,
  ChatPresenceStatus,
  ChatTypingEvent,
} from '@community-marketplace/types';

@Injectable()
export class ChatRealtimeService {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  emitToThread(threadId: string, event: string, payload: unknown) {
    this.server?.to(`thread:${threadId}`).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }

  emitMessage(threadId: string, message: ChatMessage) {
    this.emitToThread(threadId, 'message', { message, threadId });
  }

  emitTyping(threadId: string, userId: string, event: ChatTypingEvent) {
    this.emitToThread(threadId, 'typing', { threadId, userId, event });
  }

  /** Broadcast typing to the thread room, excluding the typer's socket. */
  emitTypingExcept(
    threadId: string,
    userId: string,
    event: ChatTypingEvent,
    exceptSocketId: string,
  ) {
    this.server
      ?.to(`thread:${threadId}`)
      .except(exceptSocketId)
      .emit('typing', { threadId, userId, event });
  }

  emitReadReceipt(
    threadId: string,
    readerId: string,
    messageIds: string[],
  ) {
    this.emitToThread(threadId, 'read_receipt', {
      threadId,
      readerId,
      messageIds,
    });
  }

  emitPresence(userId: string, status: ChatPresenceStatus) {
    this.emitToUser(userId, 'presence', { userId, status });
  }
}
