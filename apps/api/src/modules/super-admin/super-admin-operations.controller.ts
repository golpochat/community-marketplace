import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SuperAdminService } from './super-admin.service';

@RequireRole('SUPER_ADMIN')
@Controller('super-admin')
export class SuperAdminOperationsController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @RequirePermissions(PERMISSIONS.VIEW_PLATFORM_STATS)
  @Get('stats')
  getStats() {
    return this.superAdminService.getStats();
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions?.effective ?? [],
    };
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PLATFORM_PERMISSIONS)
  @Get('settings')
  getSettings() {
    return this.superAdminService.getPlatformSettings();
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PLATFORM_PERMISSIONS)
  @Patch('settings')
  updateSettings(@Body() body: Record<string, unknown>) {
    return this.superAdminService.updatePlatformSettings(body);
  }

  @RequirePermissions(PERMISSIONS.VIEW_USERS)
  @Get('users')
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.superAdminService.getUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      { role, status, search },
    );
  }

  @RequirePermissions(PERMISSIONS.VIEW_LISTINGS)
  @Get('listings')
  getListings(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.superAdminService.getListings(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @RequirePermissions(PERMISSIONS.APPROVE_LISTING)
  @Post('listings/:id/approve')
  approveListing(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.superAdminService.approveListing(id, user.id);
  }

  @RequirePermissions(PERMISSIONS.APPROVE_LISTING)
  @Post('listings/:id/reject')
  rejectListing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.superAdminService.rejectListing(id, user.id, body);
  }

  @RequirePermissions(PERMISSIONS.BAN_LISTING)
  @Post('listings/:id/remove')
  removeListing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.superAdminService.removeListing(id, user.id, body);
  }

  @RequirePermissions(PERMISSIONS.BAN_LISTING)
  @Post('listings/:id/restore')
  restoreListing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.superAdminService.restoreListing(id, user.id, body);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_LISTINGS)
  @Get('listings/:id/status-history')
  getListingStatusHistory(@Param('id') id: string) {
    return this.superAdminService.getListingStatusHistory(id);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_LISTINGS)
  @Get('listings/:id/review')
  getListingReview(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.superAdminService.getListingReview(id, user.id, user.role);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_LISTINGS)
  @Post('listings/:id/review/messages')
  addListingReviewMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.superAdminService.addListingReviewMessage(id, user.id, user.role, body);
  }

  @RequirePermissions(PERMISSIONS.APPROVE_LISTING)
  @Post('listings/:id/request-changes')
  requestListingChanges(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.superAdminService.requestListingChanges(id, user.id, user.role, body);
  }

  @RequirePermissions(PERMISSIONS.VIEW_REPORTS)
  @Get('moderation/reports')
  getModerationReports() {
    return this.superAdminService.getModerationReports();
  }

  @RequirePermissions(PERMISSIONS.VIEW_REPORTS)
  @Get('moderation/bans')
  getModerationBans() {
    return this.superAdminService.getModerationBans();
  }
}
