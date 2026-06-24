import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ChatService } from '../chat/chat.service';

@RequireRole('ADMIN')
@Controller('admin/chat')
export class AdminChatController {
  constructor(private readonly chatService: ChatService) {}

  @RequirePermissions(PERMISSIONS.MODERATE_CHAT)
  @Get('threads/:threadId')
  getThread(
    @CurrentUser() user: AuthenticatedUser,
    @Param('threadId') threadId: string,
  ) {
    return this.chatService.adminGetThread(threadId, user.id, user.role);
  }

  @RequirePermissions(PERMISSIONS.MODERATE_CHAT)
  @Get('messages/search')
  searchMessages(@Query() query: Record<string, string>) {
    return this.chatService.adminSearchMessages(query);
  }

  @RequirePermissions(PERMISSIONS.FLAG_MESSAGE)
  @Post('messages/:messageId/flag')
  flagMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId') messageId: string,
    @Body() body: unknown,
  ) {
    return this.chatService.adminFlagMessage(user.id, messageId, body);
  }

  @RequirePermissions(PERMISSIONS.BAN_FROM_CHAT)
  @Post('ban')
  banUser(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.chatService.adminBanUser(user.id, body);
  }
}
