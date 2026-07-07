import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  broadcastNotificationSchema,
  notificationListQuerySchema,
  notificationProviderSchema,
  notificationTemplateSchema,
  templatePreviewSchema,
} from '@community-marketplace/validation';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { SendNotificationDto } from '../notifications/dto/notifications.dto';
import { NotificationsService } from '../notifications/notifications.service';

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('inbox')
  listInbox(@CurrentUser() user: AuthenticatedUser, @Query() query: Record<string, string>) {
    const parsed = notificationListQuerySchema.parse({
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      unreadOnly: query.unreadOnly,
    });
    return this.notificationsService.findByUser(user.id, parsed.page, parsed.limit, parsed.unreadOnly);
  }

  @Get('inbox/unread-count')
  inboxUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch('inbox/read')
  markInboxRead(@CurrentUser() user: AuthenticatedUser, @Body() body: { notificationId: string }) {
    return this.notificationsService.markRead(user.id, body.notificationId);
  }

  @Patch('inbox/read-all')
  markInboxAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Delete('inbox/:id')
  deleteInboxItem(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notificationsService.delete(user.id, id);
  }

  @RequirePermissions(PERMISSIONS.SEND_NOTIFICATION)
  @Post('send')
  send(@Body() dto: SendNotificationDto) {
    return this.notificationsService.send(dto);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_NOTIFICATIONS)
  @Post('broadcast')
  broadcast(@Body() body: unknown) {
    const dto = broadcastNotificationSchema.parse(body);
    return this.notificationsService.broadcast(dto);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_NOTIFICATIONS)
  @Get('templates')
  listTemplates(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.notificationsService.listTemplates(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @RequirePermissions(PERMISSIONS.MANAGE_NOTIFICATIONS)
  @Post('templates')
  createTemplate(@Body() body: unknown) {
    const dto = notificationTemplateSchema.parse(body);
    return this.notificationsService.createTemplate(dto);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_NOTIFICATIONS)
  @Post('templates/preview')
  previewTemplate(@Body() body: unknown) {
    const dto = templatePreviewSchema.parse(body);
    return this.notificationsService.previewTemplate(dto);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_NOTIFICATIONS)
  @Get('providers')
  listProviders() {
    return this.notificationsService.listProviders();
  }

  @RequirePermissions(PERMISSIONS.MANAGE_NOTIFICATIONS)
  @Post('providers')
  createProvider(@Body() body: unknown) {
    const dto = notificationProviderSchema.parse(body);
    return this.notificationsService.createProvider(dto);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_NOTIFICATIONS)
  @Patch('providers/:id')
  updateProvider(@Param('id') id: string, @Body() body: unknown) {
    const dto = notificationProviderSchema.partial().parse(body);
    return this.notificationsService.updateProvider(id, dto);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_NOTIFICATIONS)
  @Get('providers/:id/health')
  providerHealth(@Param('id') id: string) {
    return this.notificationsService.providerHealth(id);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_NOTIFICATIONS)
  @Get('logs')
  listLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.notificationsService.listDeliveryLogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
