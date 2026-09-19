import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import type { Request } from 'express';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  addRolePermissionSchema,
  assignPermissionOverrideSchema,
  assignRoleSchema,
  createAdminSchema,
  removeUserRoleSchema,
  superAdminActionSchema,
  syncRolePermissionsByIdSchema,
} from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RbacManagementService } from '../admin/rbac/rbac-management.service';
import { computeDeviceFingerprint } from '../auth/utils/device-fingerprint';
import { SuperAdminService } from './super-admin.service';

@RequireRole('SUPER_ADMIN')
@Controller('super-admin')
export class SuperAdminController {
  constructor(
    private readonly superAdminService: SuperAdminService,
    private readonly rbacManagement: RbacManagementService,
  ) {}

  @RequirePermissions(PERMISSIONS.VIEW_PLATFORM_STATS)
  @Get('platform')
  getPlatformOverview() {
    return this.superAdminService.getPlatformOverview();
  }

  @RequirePermissions(PERMISSIONS.MANAGE_ROLES)
  @Get('roles')
  listRoles() {
    return this.superAdminService.listRoles();
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PERMISSIONS)
  @Get('permissions')
  listPermissions() {
    return this.superAdminService.listPermissions();
  }

  @RequirePermissions(PERMISSIONS.MANAGE_ROLES)
  @Get('roles/matrix')
  getRolePermissionMatrix() {
    return this.superAdminService.getRolePermissionMatrix();
  }

  @RequirePermissions(PERMISSIONS.MANAGE_ROLES)
  @Post('roles/:roleId/permissions')
  addRolePermission(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('roleId') roleId: string,
    @Body() body: unknown,
  ) {
    const dto = addRolePermissionSchema.parse(body);
    return this.rbacManagement.addRolePermission(actor, roleId, dto.permissionId);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_ROLES)
  @Delete('roles/:roleId/permissions/:permissionId')
  removeRolePermission(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rbacManagement.removeRolePermission(actor, roleId, permissionId);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_ROLES)
  @Put('roles/:roleId/permissions')
  syncRolePermissions(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('roleId') roleId: string,
    @Body() body: unknown,
  ) {
    return this.rbacManagement.syncRolePermissions(actor, roleId, syncRolePermissionsByIdSchema.parse(body));
  }

  @RequirePermissions(PERMISSIONS.ASSIGN_ROLE)
  @Post('users/assign-role')
  assignUserRole(@CurrentUser() actor: AuthenticatedUser, @Body() body: unknown) {
    return this.rbacManagement.assignUserRole(actor, assignRoleSchema.parse(body));
  }

  @RequirePermissions(PERMISSIONS.ASSIGN_ROLE)
  @Delete('users/:userId/role')
  removeUserRole(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ) {
    const dto = removeUserRoleSchema.parse(body ?? {});
    return this.rbacManagement.removeUserRole(actor, userId, dto.fallbackRoleId);
  }

  @RequirePermissions(PERMISSIONS.ASSIGN_PERMISSION_OVERRIDE)
  @Post('users/permission-overrides')
  assignPermissionOverride(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.rbacManagement.assignPermissionOverride(actor, assignPermissionOverrideSchema.parse(body));
  }

  @RequirePermissions(PERMISSIONS.ASSIGN_PERMISSION_OVERRIDE)
  @Delete('users/:userId/permission-overrides/:permissionId')
  revokePermissionOverride(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rbacManagement.revokePermissionOverride(actor, userId, permissionId);
  }

  @RequirePermissions(PERMISSIONS.ASSIGN_PERMISSION_OVERRIDE)
  @Get('users/:userId/permission-overrides')
  listUserPermissionOverrides(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
  ) {
    return this.rbacManagement.listUserPermissionOverrides(actor, userId);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  @Get('users/:userId/effective-permissions')
  getUserEffectivePermissions(@Param('userId') userId: string) {
    return this.rbacManagement.getUserEffectivePermissions(userId);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_ADMINS)
  @Get('admins')
  listAdmins(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.superAdminService.listAdmins(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @RequirePermissions(PERMISSIONS.MANAGE_ADMINS)
  @Get('admins/:userId')
  getAdminStaffMember(@Param('userId') userId: string) {
    return this.superAdminService.getAdminStaffMember(userId);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_ADMINS)
  @Patch('admins/:userId/role')
  updateAdminStaffRole(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.superAdminService.updateAdminStaffRole(actor.id, userId, body);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_ADMINS)
  @Patch('admins/:userId/status')
  updateAdminStaffStatus(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.superAdminService.updateAdminStaffStatus(actor.id, userId, body);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_ADMINS)
  @Post('admins/:userId/send-password-reset')
  sendAdminStaffPasswordReset(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    return this.superAdminService.sendAdminStaffPasswordReset(actor.id, userId, this.sessionContext(req));
  }

  @RequirePermissions(PERMISSIONS.MANAGE_ADMINS)
  @Post('admins')
  createAdmin(@Body() body: unknown) {
    const dto = createAdminSchema.parse(body);
    return this.superAdminService.createAdmin(dto.email);
  }

  @RequirePermissions(PERMISSIONS.VIEW_AUDIT_LOG)
  @Get('audit')
  getAuditLog(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.superAdminService.getAuditLog(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @RequirePermissions(PERMISSIONS.EXECUTE_ADMIN_ACTION)
  @Post('actions')
  executeAction(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.superAdminService.executeAction(user.id, superAdminActionSchema.parse(body));
  }

  private sessionContext(req: Request) {
    const clientFingerprint = req.headers['x-device-fingerprint'];
    const fingerprintHeader = typeof clientFingerprint === 'string' ? clientFingerprint : undefined;

    return {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      deviceFingerprint: computeDeviceFingerprint(
        req.headers['user-agent'],
        req.ip,
        fingerprintHeader,
      ),
    };
  }
}
