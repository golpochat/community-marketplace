import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ChatService } from './chat.service';
import type { SendMessageDto } from './dto/chat.dto';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    client.join(`user:${data.userId}`);
    return { joined: true, userId: data.userId };
  }

  @SubscribeMessage('send_message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto & { senderId: string },
  ) {
    const message = this.chatService.sendMessage(data.senderId, data);
    this.server.to(`user:${data.recipientId}`).emit('message', message);
    client.emit('message_sent', message);
    return message;
  }

  @SubscribeMessage('mark_read')
  handleMarkRead(
    @MessageBody() data: { userId: string; conversationId: string },
  ) {
    this.chatService.markAsRead(data.userId, data.conversationId);
    return { read: true };
  }
}
