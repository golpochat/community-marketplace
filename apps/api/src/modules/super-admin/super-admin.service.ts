import { Injectable } from '@nestjs/common';

import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_CODES,
  RBAC_ROLES,
  type PermissionCode,
  type RbacRole,
  type SuperAdminActivityEvent,
} from '@community-marketplace/types';

import { PrismaService } from '../../database/prisma.service';
import { AdminService } from '../admin/admin.service';
import { UsersService } from '../users/users.service';
import type { AdminActionDto } from '../admin/dto/admin.dto';
import type { SuperAdminActionDto } from './dto/super-admin.dto';
import type { PlatformGovernanceUpdateInput } from '@community-marketplace/validation';

const OPEN_DISPUTE_STATUSES = ['open', 'awaiting_evidence', 'under_review'] as const;

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  async getPlatformOverview() {
    const now = new Date();
    const [stats, governanceStatus, governanceCounts, recentActivity] = await Promise.all([
      this.adminService.getStats(),
      this.adminService.getPlatformSettings(),
      Promise.all([
        this.prisma.user.count({
          where: { primaryRole: { code: 'ADMIN' } },
        }),
        this.prisma.adminInvitation.count({
          where: {
            acceptedAt: null,
            revokedAt: null,
            expiresAt: { gt: now },
          },
        }),
        this.prisma.marketplaceDispute.count({
          where: { disputeStatus: { in: [...OPEN_DISPUTE_STATUSES] } },
        }),
        this.prisma.fraudSignal.count({
          where: { dismissedAt: null },
        }),
        this.prisma.listing.count({
          where: { status: 'pending_review' },
        }),
        this.prisma.sellerVerificationRequest.count({
          where: { status: 'pending' },
        }),
      ]),
      this.fetchRecentActivity(5),
    ]);

    const [
      activeAdminCount,
      pendingInvitations,
      openDisputes,
      openFraudSignals,
      pendingListingReviews,
      pendingSellerVerifications,
    ] = governanceCounts;

    return {
      ...stats,
      roles: RBAC_ROLES.length,
      permissions: PERMISSION_CODES.length,
      platformFlags: {
        maintenanceMode: governanceStatus.settings.maintenanceMode,
        securityMfaRequired: governanceStatus.settings.securityMfaRequired,
      },
      governance: {
        activeAdminCount,
        pendingInvitations,
        openDisputes,
        openFraudSignals,
        pendingListingReviews,
        pendingSellerVerifications,
      },
      recentActivity,
    };
  }

  async listPrivilegedAuditTrail(page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const take = safePage * safeLimit;

    const [userRows, modRows, userTotal, modTotal] = await Promise.all([
      this.prisma.userAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take,
      }),
      this.prisma.moderationAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take,
      }),
      this.prisma.userAuditLog.count(),
      this.prisma.moderationAuditLog.count(),
    ]);

    const merged = this.mergeActivity(
      userRows.map((row) => this.mapUserAuditRow(row)),
      modRows.map((row) => this.mapModerationAuditRow(row)),
    );

    const start = (safePage - 1) * safeLimit;
    const total = userTotal + modTotal;

    return {
      data: merged.slice(start, start + safeLimit),
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }

  private async fetchRecentActivity(limit: number): Promise<SuperAdminActivityEvent[]> {
    const [userRows, modRows] = await Promise.all([
      this.prisma.userAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.moderationAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    return this.mergeActivity(
      userRows.map((row) => this.mapUserAuditRow(row)),
      modRows.map((row) => this.mapModerationAuditRow(row)),
    ).slice(0, limit);
  }

  private mapUserAuditRow(row: {
    id: string;
    eventType: string;
    actorId: string | null;
    targetUserId: string | null;
    createdAt: Date;
  }): SuperAdminActivityEvent {
    return {
      id: `user:${row.id}`,
      source: 'user',
      eventType: row.eventType,
      createdAt: row.createdAt.toISOString(),
      actorId: row.actorId ?? undefined,
      targetUserId: row.targetUserId ?? undefined,
    };
  }

  private mapModerationAuditRow(row: {
    id: string;
    eventType: string;
    actorId: string | null;
    reportId: string | null;
    userId: string | null;
    createdAt: Date;
  }): SuperAdminActivityEvent {
    return {
      id: `moderation:${row.id}`,
      source: 'moderation',
      eventType: row.eventType,
      createdAt: row.createdAt.toISOString(),
      actorId: row.actorId ?? undefined,
      reportId: row.reportId ?? undefined,
      userId: row.userId ?? undefined,
    };
  }

  private mergeActivity(
    userEvents: SuperAdminActivityEvent[],
    moderationEvents: SuperAdminActivityEvent[],
  ): SuperAdminActivityEvent[] {
    return [...userEvents, ...moderationEvents].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
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

  getAuditLog(page?: number, limit?: number) {
    if (page !== undefined || limit !== undefined) {
      return this.listPrivilegedAuditTrail(page ?? 1, limit ?? 20);
    }
    return this.listPrivilegedAuditTrail(1, 20);
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

  updatePlatformSettings(settings: PlatformGovernanceUpdateInput) {
    return this.adminService.updatePlatformSettings(settings);
  }
}
