import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import {
  RequireAnyPermission,
  RequireRole,
} from '../../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import {
  AddRolePermissionDto,
  AssignPermissionOverrideDto,
  AssignUserRoleDto,
  CreateCustomRoleDto,
  RemoveUserRoleDto,
  SyncRolePermissionsDto,
  UpdateCustomRoleDto,
} from './dto/rbac-management.dto';
import { RbacManagementService } from './rbac-management.service';

const RBAC_CATALOG_PERMISSIONS = [
  PERMISSIONS.MANAGE_ROLES,
  PERMISSIONS.MANAGE_PERMISSIONS,
  PERMISSIONS.MANAGE_ACCOUNTS_PERMISSIONS,
  PERMISSIONS.MANAGE_FINANCIAL_PERMISSIONS,
  PERMISSIONS.MANAGE_MODERATION_PERMISSIONS,
  PERMISSIONS.MANAGE_LISTING_PERMISSIONS,
  PERMISSIONS.MANAGE_PLATFORM_PERMISSIONS,
] as const;

const RBAC_ROLE_MUTATION_PERMISSIONS = [
  PERMISSIONS.MANAGE_ROLES,
  PERMISSIONS.MANAGE_ACCOUNTS_PERMISSIONS,
  PERMISSIONS.MANAGE_FINANCIAL_PERMISSIONS,
  PERMISSIONS.MANAGE_MODERATION_PERMISSIONS,
  PERMISSIONS.MANAGE_LISTING_PERMISSIONS,
  PERMISSIONS.MANAGE_PLATFORM_PERMISSIONS,
] as const;

/**
 * RBAC management API for the admin frontend.
 * Base path: /api/admin/rbac
 *
 * @see ./README.md for full endpoint documentation and authorization matrix.
 */
@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin/rbac')
export class AdminRbacController {
  constructor(private readonly rbacManagement: RbacManagementService) {}

  @RequireAnyPermission(...RBAC_CATALOG_PERMISSIONS)
  @Get('scopes')
  listScopes(@CurrentUser() actor: AuthenticatedUser) {
    return this.rbacManagement.listScopes(actor);
  }

  @RequireAnyPermission(PERMISSIONS.MANAGE_ROLES)
  @Post('roles')
  createRole(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CreateCustomRoleDto) {
    return this.rbacManagement.createRole(actor, dto);
  }

  @RequireAnyPermission(PERMISSIONS.MANAGE_ROLES)
  @Put('roles/:roleId')
  updateRole(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateCustomRoleDto,
  ) {
    return this.rbacManagement.updateRole(actor, roleId, dto);
  }

  @RequireAnyPermission(PERMISSIONS.MANAGE_ROLES)
  @Delete('roles/:roleId')
  deleteRole(@CurrentUser() actor: AuthenticatedUser, @Param('roleId') roleId: string) {
    return this.rbacManagement.deleteRole(actor, roleId);
  }

  @RequireAnyPermission(...RBAC_CATALOG_PERMISSIONS)
  @Get('roles')
  listRoles(@CurrentUser() actor: AuthenticatedUser) {
    return this.rbacManagement.listRoles(actor);
  }

  @RequireAnyPermission(...RBAC_CATALOG_PERMISSIONS)
  @Get('permissions')
  listPermissions(@CurrentUser() actor: AuthenticatedUser, @Query('scope') scope?: string) {
    return this.rbacManagement.listPermissions(actor, scope);
  }

  @RequireAnyPermission(...RBAC_CATALOG_PERMISSIONS)
  @Get('roles/:roleId/permissions')
  getRolePermissions(@CurrentUser() actor: AuthenticatedUser, @Param('roleId') roleId: string) {
    return this.rbacManagement.getRolePermissions(actor, roleId);
  }

  @RequireAnyPermission(PERMISSIONS.ASSIGN_ROLE, PERMISSIONS.MANAGE_ADMINS)
  @Post('users/assign-role')
  assignUserRole(@CurrentUser() actor: AuthenticatedUser, @Body() dto: AssignUserRoleDto) {
    return this.rbacManagement.assignUserRole(actor, dto);
  }

  @RequireAnyPermission(PERMISSIONS.ASSIGN_ROLE, PERMISSIONS.MANAGE_ADMINS)
  @Delete('users/:userId/role')
  removeUserRole(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: RemoveUserRoleDto,
  ) {
    return this.rbacManagement.removeUserRole(actor, userId, dto.fallbackRoleId);
  }

  @RequireAnyPermission(...RBAC_ROLE_MUTATION_PERMISSIONS)
  @Post('roles/:roleId/permissions')
  addRolePermission(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('roleId') roleId: string,
    @Body() dto: AddRolePermissionDto,
  ) {
    return this.rbacManagement.addRolePermission(actor, roleId, dto.permissionId);
  }

  @RequireAnyPermission(...RBAC_ROLE_MUTATION_PERMISSIONS)
  @Delete('roles/:roleId/permissions/:permissionId')
  removeRolePermission(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rbacManagement.removeRolePermission(actor, roleId, permissionId);
  }

  @RequireAnyPermission(...RBAC_ROLE_MUTATION_PERMISSIONS)
  @Put('roles/:roleId/permissions')
  syncRolePermissions(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('roleId') roleId: string,
    @Body() dto: SyncRolePermissionsDto,
  ) {
    return this.rbacManagement.syncRolePermissions(actor, roleId, dto);
  }

  @RequireAnyPermission(PERMISSIONS.ASSIGN_PERMISSION_OVERRIDE)
  @Post('users/permission-overrides')
  assignPermissionOverride(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: AssignPermissionOverrideDto,
  ) {
    return this.rbacManagement.assignPermissionOverride(actor, dto);
  }

  @RequireAnyPermission(PERMISSIONS.ASSIGN_PERMISSION_OVERRIDE)
  @Delete('users/:userId/permission-overrides/:permissionId')
  revokePermissionOverride(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rbacManagement.revokePermissionOverride(actor, userId, permissionId);
  }

  @RequireAnyPermission(
    PERMISSIONS.ASSIGN_PERMISSION_OVERRIDE,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_ACCOUNTS_PERMISSIONS,
  )
  @Get('users/:userId/permission-overrides')
  listUserPermissionOverrides(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
  ) {
    return this.rbacManagement.listUserPermissionOverrides(actor, userId);
  }

  @RequireAnyPermission(
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MANAGE_ACCOUNTS_PERMISSIONS,
  )
  @Get('users/:userId/effective-permissions')
  getUserEffectivePermissions(@Param('userId') userId: string) {
    return this.rbacManagement.getUserEffectivePermissions(userId);
  }
}
