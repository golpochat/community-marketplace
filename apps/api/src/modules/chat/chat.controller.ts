import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';

@RequireRole('BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @RequirePermissions(PERMISSIONS.VIEW_CONVERSATIONS)
  @Get('inbox')
  inbox(@CurrentUser() user: AuthenticatedUser, @Query() query: Record<string, string>) {
    return this.chatService.listInbox(user.id, user.role, query);
  }

  @RequirePermissions(PERMISSIONS.VIEW_CONVERSATIONS)
  @Get('threads/listing/:listingId')
  getByListing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId') listingId: string,
  ) {
    return this.chatService.getThreadByListing(user.id, user.role, listingId);
  }

  @RequirePermissions(PERMISSIONS.VIEW_CONVERSATIONS)
  @Get('threads/:threadId')
  getThread(
    @CurrentUser() user: AuthenticatedUser,
    @Param('threadId') threadId: string,
  ) {
    return this.chatService.getThread(threadId, user.id, user.role);
  }

  @RequirePermissions(PERMISSIONS.VIEW_CONVERSATIONS)
  @Post('threads')
  createThread(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.chatService.createThread(user.id, user.role, body);
  }

  @RequirePermissions(PERMISSIONS.VIEW_CONVERSATIONS)
  @Post('threads/:threadId/archive')
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('threadId') threadId: string,
  ) {
    return this.chatService.archiveThread(threadId, user.id, user.role);
  }

  @RequirePermissions(PERMISSIONS.VIEW_CONVERSATIONS)
  @Post('threads/:threadId/unarchive')
  unarchive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('threadId') threadId: string,
  ) {
    return this.chatService.unarchiveThread(threadId, user.id, user.role);
  }

  @RequirePermissions(PERMISSIONS.VIEW_CONVERSATIONS)
  @Get('threads/:threadId/messages')
  listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('threadId') threadId: string,
    @Query() query: Record<string, string>,
  ) {
    return this.chatService.listMessages(threadId, user.id, user.role, query);
  }

  @RequirePermissions(PERMISSIONS.SEND_MESSAGE)
  @Post('messages')
  sendMessage(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.chatService.sendMessage(user.id, user.role, body);
  }

  @RequirePermissions(PERMISSIONS.SEND_MESSAGE)
  @Patch('messages/:messageId')
  editMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId') messageId: string,
    @Body() body: unknown,
  ) {
    return this.chatService.editMessage(messageId, user.id, user.role, body);
  }

  @RequirePermissions(PERMISSIONS.DELETE_MESSAGE)
  @Delete('messages/:messageId')
  deleteMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId') messageId: string,
  ) {
    return this.chatService.deleteMessage(messageId, user.id, user.role).then(() => ({
      deleted: true,
    }));
  }

  @RequirePermissions(PERMISSIONS.VIEW_CONVERSATIONS)
  @Post('messages/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.chatService.markRead(user.id, user.role, body);
  }

  @RequirePermissions(PERMISSIONS.SEND_MESSAGE)
  @Post('threads/:threadId/attachments/upload-url')
  attachmentUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('threadId') threadId: string,
    @Body() body: unknown,
  ) {
    return this.chatService.createAttachmentUploadUrl(
      threadId,
      user.id,
      user.role,
      body,
    );
  }
}
