import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ModerationService } from './moderation.service';

@RequireRole('BUYER', 'SELLER')
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('reports/users')
  reportUser(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.moderationService.reportUser(user.id, body);
  }

  @RequirePermissions(PERMISSIONS.REPORT_LISTING)
  @Post('reports/listings')
  reportListing(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.moderationService.reportListing(user.id, body);
  }

  @RequirePermissions(PERMISSIONS.FLAG_MESSAGE)
  @Post('reports/messages')
  reportMessage(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.moderationService.reportMessage(user.id, body);
  }

  @Post('appeals')
  submitAppeal(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.moderationService.submitAppeal(user.id, body);
  }

  @Get('appeals/mine')
  myAppeals(@CurrentUser() user: AuthenticatedUser) {
    return this.moderationService.listAppeals({ userId: user.id, page: 1, limit: 50 });
  }

  @Get('appeals/:id')
  getAppeal(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.moderationService.getAppeal(id);
  }
}
