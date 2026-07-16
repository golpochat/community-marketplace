import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import type { AuthPayload } from '@community-marketplace/types';
import {
  chatTypingSchema,
  markMessagesReadSchema,
  sendChatMessageSchema,
} from '@community-marketplace/validation';

import { JwtAuthService } from '../auth/services/jwt-auth.service';
import { ChatMessagesService } from './services/chat-messages.service';
import { ChatPresenceService } from './services/chat-presence.service';
import { ChatRealtimeService } from './services/chat-realtime.service';
import { ChatAccessService } from './services/chat-access.service';
import { ChatThreadsService } from './services/chat-threads.service';

interface AuthenticatedSocket extends Socket {
  data: { user?: AuthPayload };
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? '*' },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtAuth: JwtAuthService,
    private readonly messages: ChatMessagesService,
    private readonly threads: ChatThreadsService,
    private readonly access: ChatAccessService,
    private readonly realtime: ChatRealtimeService,
    private readonly presence: ChatPresenceService,
  ) {}

  afterInit(server: Server) {
    this.realtime.setServer(server);
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const user = this.jwtAuth.verifyAccessToken(token);
      client.data.user = user;
      await client.join(`user:${user.sub}`);
      await this.presence.setOnline(user.sub);
      this.realtime.emitPresence(user.sub, 'online');
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data.user?.sub;
    if (!userId) return;
    await this.presence.setOffline(userId);
    this.realtime.emitPresence(userId, 'offline');
  }

  @SubscribeMessage('join_thread')
  async handleJoinThread(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string },
  ) {
    const user = client.data.user;
    if (!user) return { error: 'Unauthorized' };

    await this.access.assertCanAccessThread(
      data.threadId,
      user.sub,
      user.role,
    );
    await client.join(`thread:${data.threadId}`);
    return { joined: true, threadId: data.threadId };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: unknown,
  ) {
    const user = client.data.user;
    if (!user) return { error: 'Unauthorized' };

    const parsed = sendChatMessageSchema.parse(body);
    return this.messages.send(user.sub, user.role, parsed);
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: unknown,
  ) {
    const user = client.data.user;
    if (!user) return { error: 'Unauthorized' };

    const parsed = chatTypingSchema.parse(body);
    await this.access.assertCanAccessThread(
      parsed.threadId,
      user.sub,
      user.role,
    );
    this.realtime.emitTypingExcept(
      parsed.threadId,
      user.sub,
      parsed.event,
      client.id,
    );
    return { ok: true };
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: unknown,
  ) {
    const user = client.data.user;
    if (!user) return { error: 'Unauthorized' };

    const parsed = markMessagesReadSchema.parse(body);
    const result = await this.messages.markRead(user.sub, user.role, parsed);
    this.realtime.emitReadReceipt(
      parsed.threadId,
      user.sub,
      result.messageIds,
    );
    return result;
  }
}
