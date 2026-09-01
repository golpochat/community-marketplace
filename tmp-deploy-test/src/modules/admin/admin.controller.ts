import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AdminActionDto, SuspendUserDto } from './dto/admin.dto';
import { AdminService } from './admin.service';

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @RequirePermissions(PERMISSIONS.VIEW_PLATFORM_STATS)
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
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

  @RequirePermissions(PERMISSIONS.VIEW_USERS)
  @Get('users')
  getUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      {
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
        ...(search ? { search } : {}),
      },
      user.role,
    );
  }

  @RequirePermissions(PERMISSIONS.SUSPEND_USER)
  @Post('users/suspend')
  suspendUser(@CurrentUser() user: AuthenticatedUser, @Body() dto: SuspendUserDto) {
    return this.adminService.suspendUser(user.id, user.role as 'ADMIN' | 'SUPER_ADMIN', dto);
  }

  @RequirePermissions(PERMISSIONS.EXECUTE_ADMIN_ACTION)
  @Post('actions')
  executeAction(@CurrentUser() user: AuthenticatedUser, @Body() dto: AdminActionDto) {
    return this.adminService.executeAction(user?.id ?? 'admin-1', dto);
  }

  @RequirePermissions(PERMISSIONS.VIEW_AUDIT_LOG)
  @Get('audit')
  getAuditLog() {
    return this.adminService.getAuditLog();
  }
}
