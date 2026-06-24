import { Body, Controller, Get, Patch, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  MarkNotificationReadDto,
  RegisterDeviceDto,
} from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';
import { DeviceTokenService } from './services/fcm.service';

/** User notification inbox — admin send lives under /admin/notifications */
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly deviceTokenService: DeviceTokenService,
  ) {}

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.findByUser(user?.id ?? 'user-1');
  }

  @Post('devices')
  registerDevice(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterDeviceDto) {
    return this.deviceTokenService.register(user?.id ?? 'user-1', dto);
  }

  @Patch('read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Body() dto: MarkNotificationReadDto) {
    return this.notificationsService.markRead(user?.id ?? 'user-1', dto.notificationId);
  }
}
