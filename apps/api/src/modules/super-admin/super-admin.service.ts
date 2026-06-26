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

  getUsers(
    page = 1,
    limit = 20,
    query: Record<string, string | undefined> = {},
    actorRole: RbacRole = 'SUPER_ADMIN',
  ) {
    return this.adminService.getUsers(page, limit, query, actorRole);
  }

  getListings(page = 1, limit = 20) {
    return this.adminService.getListings(page, limit);
  }

  approveListing(listingId: string, adminId: string) {
    return this.adminService.approveListing(listingId, adminId);
  }

  rejectListing(listingId: string, adminId: string, body: unknown) {
    return this.adminService.rejectListing(listingId, adminId, body);
  }

  removeListing(listingId: string, adminId: string, body: unknown) {
    return this.adminService.removeListing(listingId, adminId, body);
  }

  restoreListing(listingId: string, adminId: string, body: unknown) {
    return this.adminService.restoreListing(listingId, adminId, body);
  }

  getListingStatusHistory(listingId: string) {
    return this.adminService.getListingStatusHistory(listingId);
  }

  getListingReview(listingId: string, actorId: string, role: RbacRole) {
    return this.adminService.getListingReview(listingId, actorId, role);
  }

  addListingReviewMessage(
    listingId: string,
    actorId: string,
    role: RbacRole,
    body: unknown,
  ) {
    return this.adminService.addListingReviewMessage(listingId, actorId, role, body);
  }

  requestListingChanges(
    listingId: string,
    adminId: string,
    role: RbacRole,
    body: unknown,
  ) {
    return this.adminService.requestListingChanges(listingId, adminId, role, body);
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

  getPlatformSettings() {
    return this.adminService.getPlatformSettings();
  }

  updatePlatformSettings(settings: Record<string, unknown>) {
    return this.adminService.updatePlatformSettings(settings as Parameters<AdminService['updatePlatformSettings']>[0]);
  }
}
