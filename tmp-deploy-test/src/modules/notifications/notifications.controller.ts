import { Body, Controller, Get, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  MarkNotificationReadDto,
  RegisterDeviceDto,
} from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';
import { DeviceTokenService } from './services/device-token.service';

/** Legacy inbox routes — prefer role-scoped /buyer|seller/notifications */
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly deviceTokenService: DeviceTokenService,
  ) {}

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.findByUser(user.id);
  }

  @Post('devices')
  registerDevice(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterDeviceDto) {
    return this.deviceTokenService.register(user.id, dto);
  }

  @Patch('read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Body() dto: MarkNotificationReadDto) {
    return this.notificationsService.markRead(user.id, dto.notificationId);
  }
}
