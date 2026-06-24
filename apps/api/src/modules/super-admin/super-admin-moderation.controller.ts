import {
  Body,
  Controller,
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
import { ModerationService } from '../moderation/moderation.service';

@RequireRole('SUPER_ADMIN')
@Controller('super-admin/moderation')
export class SuperAdminModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @RequirePermissions(PERMISSIONS.VIEW_REPORTS)
  @Get('reports')
  listReports(@Query() query: unknown) {
    return this.moderationService.listReports(query);
  }

  @RequirePermissions(PERMISSIONS.VIEW_REPORTS)
  @Get('reports/:id')
  getReport(@Param('id') id: string) {
    return this.moderationService.getReport(id);
  }

  @RequirePermissions(PERMISSIONS.RESOLVE_REPORT)
  @Post('reports/:id/actions')
  takeAction(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.moderationService.takeAction(id, user.id, body);
  }

  @RequirePermissions(PERMISSIONS.VIEW_REPORTS)
  @Get('bans')
  getBans() {
    return this.moderationService.getBans();
  }

  @RequirePermissions(PERMISSIONS.VIEW_REPORTS)
  @Get('appeals')
  listAppeals(@Query() query: unknown) {
    return this.moderationService.listAppeals(query);
  }

  @RequirePermissions(PERMISSIONS.RESOLVE_REPORT)
  @Patch('appeals/:id')
  reviewAppeal(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.moderationService.reviewAppeal(id, user.id, body, true);
  }

  @RequirePermissions(PERMISSIONS.VIEW_AUDIT_LOG)
  @Get('audit-logs')
  listAuditLogs(@Query() query: unknown) {
    return this.moderationService.listAuditLogs(query);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PLATFORM_STATS)
  @Get('analytics')
  getAnalytics(@Query() query: unknown) {
    return this.moderationService.getAnalytics(query);
  }
}
