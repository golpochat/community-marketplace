import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { FraudDetectionService } from './services/fraud-detection.service';

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin/fraud')
export class AdminFraudController {
  constructor(private readonly fraud: FraudDetectionService) {}

  @RequirePermissions(PERMISSIONS.VIEW_FRAUD)
  @Get('high-risk-users')
  listHighRiskUsers(@Query() query: Record<string, string>) {
    return this.fraud.listHighRiskUsers(query);
  }

  @RequirePermissions(PERMISSIONS.VIEW_FRAUD)
  @Get('high-risk-listings')
  listHighRiskListings(@Query() query: Record<string, string>) {
    return this.fraud.listHighRiskListings(query);
  }

  @RequirePermissions(PERMISSIONS.VIEW_FRAUD)
  @Get('signals')
  listSignals(@Query() query: Record<string, string>) {
    return this.fraud.listSignals(query);
  }

  @RequirePermissions(PERMISSIONS.VIEW_FRAUD)
  @Get('users/:userId/breakdown')
  getUserBreakdown(@Param('userId') userId: string) {
    return this.fraud.getUserRiskBreakdown(userId);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_FRAUD)
  @Post('mark-safe')
  markSafe(@CurrentUser() admin: AuthenticatedUser, @Body() body: unknown) {
    return this.fraud.markSafe(admin.id, body);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_FRAUD)
  @Post('escalate')
  escalate(@CurrentUser() admin: AuthenticatedUser, @Body() body: unknown) {
    return this.fraud.escalate(admin.id, body);
  }
}
