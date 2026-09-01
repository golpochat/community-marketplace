import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  broadcastNotificationSchema,
  notificationProviderSchema,
  notificationTemplateSchema,
  templatePreviewSchema,
} from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { SendNotificationDto } from '../notifications/dto/notifications.dto';
import { NotificationsService } from '../notifications/notifications.service';

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

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
