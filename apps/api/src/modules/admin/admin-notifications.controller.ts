import { Body, Controller, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

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
}
