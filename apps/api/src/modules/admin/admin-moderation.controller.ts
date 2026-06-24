import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  CreateBanDto,
  LiftBanDto,
  ResolveReportDto,
} from '../moderation/dto/moderation.dto';
import { ModerationService } from '../moderation/moderation.service';

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin/moderation')
export class AdminModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @RequirePermissions(PERMISSIONS.VIEW_REPORTS)
  @Get('reports')
  getReports() {
    return this.moderationService.getReports();
  }

  @RequirePermissions(PERMISSIONS.RESOLVE_REPORT)
  @Patch('reports/:id')
  resolveReport(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ResolveReportDto,
  ) {
    return this.moderationService.resolveReport(id, user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.BAN_USER)
  @Post('bans')
  createBan(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBanDto) {
    return this.moderationService.createBan(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.VIEW_REPORTS)
  @Get('bans')
  getBans() {
    return this.moderationService.getBans();
  }

  @RequirePermissions(PERMISSIONS.BAN_USER)
  @Patch('bans/:id/lift')
  liftBan(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LiftBanDto,
  ) {
    return this.moderationService.liftBan(id, user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.VIEW_REPORTS)
  @Get('bans/check/:userId')
  checkBan(@Param('userId') userId: string) {
    return this.moderationService.isUserBanned(userId);
  }
}
