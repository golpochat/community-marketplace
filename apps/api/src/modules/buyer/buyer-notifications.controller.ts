import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { notificationListQuerySchema, notificationPreferencesUpdateSchema } from '@community-marketplace/validation';

import { RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RegisterDeviceDto } from '../notifications/dto/notifications.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { DeviceTokenService } from '../notifications/services/device-token.service';

@RequireRole('BUYER')
@Controller('buyer/notifications')
export class BuyerNotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly deviceTokens: DeviceTokenService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: Record<string, string>) {
    const parsed = notificationListQuerySchema.parse({
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      unreadOnly: query.unreadOnly,
    });
    return this.notifications.findByUser(user.id, parsed.page, parsed.limit, parsed.unreadOnly);
  }

  @Get('preferences')
  getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.getPreferences(user.id);
  }

  @Patch('preferences')
  updatePreferences(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = notificationPreferencesUpdateSchema.parse(body);
    return this.notifications.updatePreferences(user.id, dto);
  }

  @Post('devices')
  registerDevice(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterDeviceDto) {
    return this.deviceTokens.register(user.id, dto);
  }

  @Patch('read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Body() body: { notificationId: string }) {
    return this.notifications.markRead(user.id, body.notificationId);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Delete(':id')
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notifications.delete(user.id, id);
  }
}
