import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import {
  ADMIN_PERSONA_ROLE_CODES,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_CODES,
  RBAC_ROLES,
  STAFF_ROLE_CHANGE_REASON_LABELS,
  STAFF_STATUS_CHANGE_REASON_LABELS,
  isAdminPanelRoleCode,
  type PermissionCode,
  type RbacRole,
  type StaffAdminAuditEntry,
  type SuperAdminActivityEvent,
  type UserAuditEventType,
} from '@community-marketplace/types';

import {
  formatAuditActivityDetail,
  formatAuditEventLabel,
  formatAuditUserLabel,
} from '@community-marketplace/utils';

import {
  updateStaffRoleSchema,
  updateStaffStatusSchema,
  type PlatformGovernanceUpdateInput,
} from '@community-marketplace/validation';

import {
  assertBootstrapSuperAdminImmutable,
  assertSuperAdminRoleNotAssignable,
} from '../../common/constants/bootstrap-users';
import { PrismaService } from '../../database/prisma.service';
import { AuthService } from '../auth/auth.service';
import type { SessionContext } from '../auth/services/session.service';
import { SessionService } from '../auth/services/session.service';
import { isAuthenticationBlockedStatus } from '../auth/utils/user-auth-status';
import { AdminService } from '../admin/admin.service';
import { UsersService } from '../users/users.service';
import { mapUserProfile, userProfileInclude } from '../users/mappers/user.mapper';
import { UserAuditService } from '../users/services/user-audit.service';
import type { AdminActionDto } from '../admin/dto/admin.dto';
import type { SuperAdminActionDto } from './dto/super-admin.dto';

const OPEN_DISPUTE_STATUSES = ['open', 'awaiting_evidence', 'under_review'] as const;

const PANEL_OPERATOR_ROLE_CODES = ['ADMIN', ...ADMIN_PERSONA_ROLE_CODES] as const;

const STAFF_AUDIT_EVENT_TYPES: UserAuditEventType[] = [
  'role_changed',
  'status_changed',
  'password_reset_sent',
];

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly userAudit: UserAuditService,
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  async getPlatformOverview() {
    const now = new Date();
    const [stats, governanceStatus, governanceCounts, recentActivity] = await Promise.all([
      this.adminService.getStats(),
      this.adminService.getPlatformSettings(),
      Promise.all([
        this.prisma.user.count({
          where: { primaryRole: { code: { in: ['ADMIN', ...ADMIN_PERSONA_ROLE_CODES] } } },
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
      roles: RBAC_ROLES.length + ADMIN_PERSONA_ROLE_CODES.length,
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
        include: {
          actor: { select: { email: true, displayName: true } },
          target: { select: { email: true, displayName: true } },
        },
      }),
      this.prisma.moderationAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take,
        include: {
          actor: { select: { email: true, displayName: true } },
        },
      }),
      this.prisma.userAuditLog.count(),
      this.prisma.moderationAuditLog.count(),
    ]);

    const merged = await this.buildActivityEvents(userRows, modRows);

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
        include: {
          actor: { select: { email: true, displayName: true } },
          target: { select: { email: true, displayName: true } },
        },
      }),
      this.prisma.moderationAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          actor: { select: { email: true, displayName: true } },
        },
      }),
    ]);

    const merged = await this.buildActivityEvents(userRows, modRows);
    return merged.slice(0, limit);
  }

  private async buildActivityEvents(
    userRows: Array<{
      id: string;
      eventType: string;
      actorId: string | null;
      targetUserId: string | null;
      metadata: unknown;
      createdAt: Date;
      actor: { email: string; displayName: string | null } | null;
      target: { email: string; displayName: string | null } | null;
    }>,
    modRows: Array<{
      id: string;
      eventType: string;
      actorId: string | null;
      reportId: string | null;
      userId: string | null;
      metadata: unknown;
      createdAt: Date;
      actor: { email: string; displayName: string | null } | null;
    }>,
  ): Promise<SuperAdminActivityEvent[]> {
    const subjectIds = modRows
      .map((row) => row.userId)
      .filter((id): id is string => Boolean(id));
    const subjectLabelById = await this.loadUserLabelMap(subjectIds);

    return this.mergeActivity(
      userRows.map((row) => this.mapUserAuditRow(row)),
      modRows.map((row) => this.mapModerationAuditRow(row, subjectLabelById)),
    );
  }

  private async loadUserLabelMap(userIds: string[]): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(userIds)];
    const labels = new Map<string, string>();
    if (!uniqueIds.length) return labels;

    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, email: true, displayName: true },
    });

    for (const user of users) {
      const label = formatAuditUserLabel(user);
      if (label) labels.set(user.id, label);
    }

    return labels;
  }

  private mapUserAuditRow(row: {
    id: string;
    eventType: string;
    actorId: string | null;
    targetUserId: string | null;
    metadata: unknown;
    createdAt: Date;
    actor: { email: string; displayName: string | null } | null;
    target: { email: string; displayName: string | null } | null;
  }): SuperAdminActivityEvent {
    const metadata = (row.metadata as Record<string, unknown> | null) ?? undefined;
    const actorLabel = formatAuditUserLabel(row.actor);
    const targetLabel = formatAuditUserLabel(row.target);
    const presentation = {
      eventType: row.eventType,
      source: 'user' as const,
      actorLabel,
      targetLabel,
      metadata,
    };

    return {
      id: `user:${row.id}`,
      source: 'user',
      eventType: row.eventType,
      eventLabel: formatAuditEventLabel(row.eventType, 'user'),
      createdAt: row.createdAt.toISOString(),
      actorId: row.actorId ?? undefined,
      actorLabel,
      targetUserId: row.targetUserId ?? undefined,
      targetLabel,
      detail: formatAuditActivityDetail(presentation),
      metadata,
    };
  }

  private mapModerationAuditRow(
    row: {
      id: string;
      eventType: string;
      actorId: string | null;
      reportId: string | null;
      userId: string | null;
      metadata: unknown;
      createdAt: Date;
      actor: { email: string; displayName: string | null } | null;
    },
    subjectLabelById: Map<string, string>,
  ): SuperAdminActivityEvent {
    const metadata = (row.metadata as Record<string, unknown> | null) ?? undefined;
    const actorLabel = formatAuditUserLabel(row.actor);
    const subjectLabel = row.userId ? subjectLabelById.get(row.userId) : undefined;
    const presentation = {
      eventType: row.eventType,
      source: 'moderation' as const,
      actorLabel,
      subjectLabel,
      metadata,
    };

    return {
      id: `moderation:${row.id}`,
      source: 'moderation',
      eventType: row.eventType,
      eventLabel: formatAuditEventLabel(row.eventType, 'moderation'),
      createdAt: row.createdAt.toISOString(),
      actorId: row.actorId ?? undefined,
      actorLabel,
      reportId: row.reportId ?? undefined,
      userId: row.userId ?? undefined,
      subjectLabel,
      detail: formatAuditActivityDetail(presentation),
      metadata,
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
    const skip = (page - 1) * limit;
    const where = {
      primaryRole: { code: { in: [...PANEL_OPERATOR_ROLE_CODES] } },
    };

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: userProfileInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: rows.map((row) => mapUserProfile(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAdminStaffMember(userId: string) {
    const user = await this.assertPanelOperatorUser(userId);
    const audit = await this.userAudit.listForAdmin({
      targetUserId: userId,
      page: 1,
      limit: 100,
    });

    const staffAudit = audit.data.filter((entry) =>
      STAFF_AUDIT_EVENT_TYPES.includes(entry.eventType),
    );

    const actorIds = [
      ...new Set(staffAudit.map((entry) => entry.actorId).filter((id): id is string => Boolean(id))),
    ];

    const actors =
      actorIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, displayName: true, email: true },
          })
        : [];

    const actorLabels = new Map(
      actors.map((actor) => [
        actor.id,
        formatAuditUserLabel({ displayName: actor.displayName, email: actor.email }),
      ]),
    );

    return {
      profile: mapUserProfile(user),
      auditHistory: staffAudit.map((entry) => ({
        id: entry.id,
        eventType: entry.eventType as StaffAdminAuditEntry['eventType'],
        actorId: entry.actorId,
        actorLabel: entry.actorId ? actorLabels.get(entry.actorId) : undefined,
        metadata: entry.metadata,
        createdAt: entry.createdAt,
      })),
    };
  }

  async updateAdminStaffRole(actorId: string, userId: string, input: unknown) {
    const parsed = updateStaffRoleSchema.parse(input);
    assertBootstrapSuperAdminImmutable(userId);
    assertSuperAdminRoleNotAssignable(parsed.role);

    if (!isAdminPanelRoleCode(parsed.role)) {
      throw new BadRequestException('Invalid staff role');
    }

    if (parsed.reason === 'other' && !parsed.reasonDetail?.trim()) {
      throw new BadRequestException('Reason details are required when selecting Other');
    }

    const user = await this.assertPanelOperatorUser(userId);
    const previousRole = user.primaryRole.code;

    if (previousRole === parsed.role) {
      return mapUserProfile(user);
    }

    const role = await this.prisma.role.findUnique({ where: { code: parsed.role } });
    if (!role) throw new NotFoundException('Role not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { primaryRoleId: role.id },
      include: userProfileInclude,
    });

    await this.userAudit.record('role_changed', actorId, userId, {
      previousRole,
      role: parsed.role,
      reason: STAFF_ROLE_CHANGE_REASON_LABELS[parsed.reason],
      reasonCode: parsed.reason,
      ...(parsed.reasonDetail?.trim() ? { reasonDetail: parsed.reasonDetail.trim() } : {}),
    });

    return mapUserProfile(updated);
  }

  async updateAdminStaffStatus(actorId: string, userId: string, input: unknown) {
    const parsed = updateStaffStatusSchema.parse(input);
    assertBootstrapSuperAdminImmutable(userId);

    if (parsed.reason === 'other' && !parsed.reasonDetail?.trim()) {
      throw new BadRequestException('Reason details are required when selecting Other');
    }

    const user = await this.assertPanelOperatorUser(userId);
    const previousStatus = user.status;

    if (previousStatus === parsed.status) {
      return mapUserProfile(user);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: parsed.status },
      include: userProfileInclude,
    });

    if (isAuthenticationBlockedStatus(parsed.status)) {
      await this.sessionService.revokeAllForUser(userId);
    }

    await this.userAudit.record('status_changed', actorId, userId, {
      previousStatus,
      status: parsed.status,
      reason: STAFF_STATUS_CHANGE_REASON_LABELS[parsed.reason],
      reasonCode: parsed.reason,
      ...(parsed.reasonDetail?.trim() ? { reasonDetail: parsed.reasonDetail.trim() } : {}),
    });

    return mapUserProfile(updated);
  }

  async sendAdminStaffPasswordReset(
    actorId: string,
    userId: string,
    context: SessionContext,
  ) {
    assertBootstrapSuperAdminImmutable(userId);

    const user = await this.assertPanelOperatorUser(userId);

    if (!user.emailVerifiedAt || !user.passwordHash) {
      throw new BadRequestException(
        'This operator has not completed account setup. Resend their invitation instead.',
      );
    }

    const sent = await this.authService.sendPasswordResetEmailForUser(user, context);
    if (!sent) {
      throw new BadRequestException('Unable to send password reset email for this operator.');
    }

    await this.userAudit.record('password_reset_sent', actorId, userId, {
      initiatedBy: 'super_admin',
    });

    return { message: `Password reset email sent to ${user.email}` };
  }

  private async assertPanelOperatorUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: userProfileInclude,
    });
    if (!user || !isAdminPanelRoleCode(user.primaryRole.code)) {
      throw new NotFoundException('Staff member not found');
    }
    return user;
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
