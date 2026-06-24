import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { JoinConversationDto, MarkReadDto, SendMessageDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @RequirePermissions(PERMISSIONS.VIEW_CONVERSATIONS)
  @Get('conversations')
  getConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.getConversations(user?.id ?? 'user-1');
  }

  @RequirePermissions(PERMISSIONS.VIEW_CONVERSATIONS)
  @Post('conversations')
  joinConversation(@CurrentUser() user: AuthenticatedUser, @Body() dto: JoinConversationDto) {
    return this.chatService.joinConversation(user?.id ?? 'user-1', dto);
  }

  @RequirePermissions(PERMISSIONS.VIEW_CONVERSATIONS)
  @Get('conversations/:id/messages')
  getMessages(@Param('id') id: string) {
    return this.chatService.getMessages(id);
  }

  @RequirePermissions(PERMISSIONS.SEND_MESSAGE)
  @Post('messages')
  sendMessage(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(user?.id ?? 'user-1', dto);
  }

  @RequirePermissions(PERMISSIONS.VIEW_CONVERSATIONS)
  @Post('messages/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Body() dto: MarkReadDto) {
    this.chatService.markAsRead(user?.id ?? 'user-1', dto.conversationId);
    return { read: true };
  }
}
