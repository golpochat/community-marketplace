import { Controller, Get, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { NotificationsService } from '../notifications/notifications.service';

@RequireRole('SUPER_ADMIN')
@Controller('super-admin/notifications')
export class SuperAdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @RequirePermissions(PERMISSIONS.MANAGE_NOTIFICATIONS)
  @Get('logs')
  listLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.notificationsService.listDeliveryLogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  @RequirePermissions(PERMISSIONS.MANAGE_NOTIFICATIONS)
  @Get('providers')
  listProviders() {
    return this.notificationsService.listProviders();
  }

  @RequirePermissions(PERMISSIONS.MANAGE_NOTIFICATIONS)
  @Get('templates')
  listTemplates(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.notificationsService.listTemplates(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 100,
    );
  }
}
