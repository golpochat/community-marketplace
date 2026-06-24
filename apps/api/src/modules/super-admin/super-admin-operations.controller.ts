import { Controller, Get, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
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
