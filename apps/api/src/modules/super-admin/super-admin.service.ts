import { Injectable } from '@nestjs/common';

import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_CODES,
  RBAC_ROLES,
  type PermissionCode,
  type RbacRole,
} from '@community-marketplace/types';

import { AdminService } from '../admin/admin.service';
import { UsersService } from '../users/users.service';
import type { AdminActionDto } from '../admin/dto/admin.dto';
import type { SuperAdminActionDto } from './dto/super-admin.dto';

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
  ) {}

  async getPlatformOverview() {
    const stats = await this.adminService.getStats();
    return {
      ...stats,
      roles: RBAC_ROLES.length,
      permissions: PERMISSION_CODES.length,
    };
  }

  getStats() {
    return this.adminService.getStats();
  }

  getUsers(page = 1, limit = 20, query: Record<string, string | undefined> = {}) {
    return this.adminService.getUsers(page, limit, query);
  }

  getListings(page = 1, limit = 20) {
    return this.adminService.getListings(page, limit);
  }

  getModerationReports() {
    return this.adminService.getModerationReports();
  }

  getModerationBans() {
    return this.adminService.getModerationBans();
  }

  listRoles() {
    return RBAC_ROLES.map((code) => ({
      code,
      name: code.replace(/_/g, ' '),
      defaultPermissions: DEFAULT_ROLE_PERMISSIONS[code],
    }));
  }

  listPermissions() {
    return PERMISSION_CODES.map((code) => ({ code }));
  }

  async listAdmins(page = 1, limit = 20) {
    const users = await this.usersService.findAll(page, limit);
    return {
      ...users,
      data: users.data.filter((user) => user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
    };
  }

  createAdmin(email: string, role: RbacRole = 'ADMIN') {
    return {
      email,
      role,
      created: true,
    };
  }

  getAuditLog() {
    return this.adminService.getAuditLog();
  }

  executeAction(superAdminId: string, dto: SuperAdminActionDto) {
    const actionDto: AdminActionDto = {
      action: dto.action as AdminActionDto['action'],
      targetType: dto.targetType,
      targetId: dto.targetId,
      metadata: dto.metadata,
    };
    return this.adminService.executeAction(superAdminId, actionDto);
  }

  getRolePermissionMatrix(): Readonly<Record<RbacRole, readonly PermissionCode[]>> {
    return DEFAULT_ROLE_PERMISSIONS;
  }
}
