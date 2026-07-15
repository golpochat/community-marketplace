import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { BanUserDto, SuspendUserDto } from './dto/users.dto';
import { UsersService } from './users.service';

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @RequirePermissions(PERMISSIONS.VIEW_USERS)
  @Get()
  listUsers(@CurrentUser() actor: AuthenticatedUser, @Query() query: Record<string, string>) {
    return this.usersService.listUsers(query, actor.role);
  }

  @RequirePermissions(PERMISSIONS.VIEW_USERS)
  @Get('search')
  searchUsers(
    @CurrentUser() actor: AuthenticatedUser,
    @Query('q') q: string,
    @Query() query: Record<string, string>,
  ) {
    return this.usersService.listUsers({ ...query, search: q }, actor.role);
  }

  @RequirePermissions(PERMISSIONS.VIEW_USERS)
  @Get('audit-logs')
  getAuditLogs(@Query() query: Record<string, string>) {
    return this.usersService.getAuditLogs(query);
  }

  @RequirePermissions(PERMISSIONS.VIEW_USERS)
  @Get(':id')
  getUser(@CurrentUser() actor: AuthenticatedUser, @Param('id') id: string) {
    return this.usersService.getUserDetails(id, actor.role);
  }

  @RequirePermissions(PERMISSIONS.SUSPEND_USER)
  @Post('suspend')
  suspendUser(@CurrentUser() actor: AuthenticatedUser, @Body() dto: SuspendUserDto) {
    return this.usersService.suspendUser(actor.id, actor.role, dto);
  }

  @RequirePermissions(PERMISSIONS.SUSPEND_USER)
  @Post(':id/unsuspend')
  unsuspendUser(@CurrentUser() actor: AuthenticatedUser, @Param('id') id: string) {
    return this.usersService.unsuspendUser(actor.id, actor.role, id);
  }

  @RequirePermissions(PERMISSIONS.BAN_USER)
  @Post('ban')
  banUser(@CurrentUser() actor: AuthenticatedUser, @Body() dto: BanUserDto) {
    return this.usersService.banUser(actor.id, actor.role, dto);
  }

  @RequirePermissions(PERMISSIONS.BAN_USER)
  @Post(':userId/bans/:banId/unban')
  unbanUser(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Param('banId') banId: string,
  ) {
    return this.usersService.unbanUser(actor.id, actor.role, userId, banId);
  }
}
