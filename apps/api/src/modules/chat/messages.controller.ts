import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import { blockConversationSchema, reportMessageSchema } from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';

/**
 * Seller messaging API — maps spec endpoints to the chat module.
 * conversations = chat_threads, message_reports = chat_message_flags
 */
@RequireRole('BUYER', 'SELLER')
@Controller('messages')
export class MessagesController {
  constructor(private readonly chatService: ChatService) {}

  @RequirePermissions(PERMISSIONS.SEND_MESSAGE)
  @Post('send')
  send(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.chatService.sendMessageViaApi(user.id, user.role, body);
  }

  @RequirePermissions(PERMISSIONS.VIEW_CONVERSATIONS)
  @Get('conversation/:id')
  getConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.getConversationDetail(conversationId, user.id, user.role);
  }

  @RequirePermissions(PERMISSIONS.VIEW_CONVERSATIONS)
  @Get('list')
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: Record<string, string>) {
    return this.chatService.listInbox(user.id, user.role, query);
  }

  @RequirePermissions(PERMISSIONS.VIEW_CONVERSATIONS)
  @Post('report')
  report(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    reportMessageSchema.parse(body);
    return this.chatService.reportMessage(user.id, user.role, body);
  }

  @RequirePermissions(PERMISSIONS.VIEW_CONVERSATIONS)
  @Post('block')
  block(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const parsed = blockConversationSchema.parse(body);
    return this.chatService.blockConversation(parsed.conversationId, user.id, user.role);
  }
}
