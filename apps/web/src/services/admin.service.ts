import type {
  AdminDashboardStats,
  AdminNotificationLogEntry,
  Listing,
  ListingReviewContext,
  MarketplaceDispute,
  ModerationAction,
  ModerationActionType,
  ModerationAnalytics,
  ModerationReport,
  ModerationReportDetail,
  Payment,
  PlatformSettings,
  RbacRole,
  RbacRoleTemplateId,
  ReindexJobStatus,
  SearchIndexMeta,
  SearchIndexName,
  SuspensionDuration,
  UserBan,
  UserProfile,
  UserVerification,
} from '@community-marketplace/types';

export interface SearchHealthResponse {
  healthy: boolean;
  indexes: SearchIndexMeta[];
}
import type { PaginatedResult } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { adminApiPath, adminRoutesForRole, type AdminApiRole } from '@/lib/admin-api-routes';
import { API_NAMESPACES } from '@/lib/rbac-routes';
import { normalizePaginated } from '@/lib/normalize-api-response';

const EMPTY_STATS: AdminDashboardStats = {
  totalUsers: 0,
  totalSellers: 0,
  totalBuyers: 0,
  activeListings: 0,
  totalPayments: 0,
  pendingVerifications: 0,
  pendingReports: 0,
  activeBans: 0,
  revenue: 0,
  platformHealth: { database: 'degraded', search: 'degraded', payments: 'degraded' },
  generatedAt: new Date().toISOString(),
};

type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  categoryId?: string;
  sellerId?: string;
};

export interface SuperAdminPlatformOverview extends AdminDashboardStats {
  roles: number;
  permissions: number;
}

export const adminService = {
  async getStats(role: AdminApiRole): Promise<AdminDashboardStats> {
    try {
      const response = await apiClient<AdminDashboardStats>(adminRoutesForRole(role).stats);
      return response.data ?? EMPTY_STATS;
    } catch {
      return EMPTY_STATS;
    }
  },

  async getPlatformOverview(): Promise<SuperAdminPlatformOverview> {
    try {
      const response = await apiClient<SuperAdminPlatformOverview>(
        adminApiPath('SUPER_ADMIN', '/platform'),
      );
      return response.data ?? { ...EMPTY_STATS, roles: 0, permissions: 0 };
    } catch {
      return { ...EMPTY_STATS, roles: 0, permissions: 0 };
    }
  },

  async listUsers(role: AdminApiRole, params: ListParams = {}): Promise<PaginatedResult<UserProfile>> {
    const response = await apiClient<UserProfile[] | PaginatedResult<UserProfile>>(
      adminApiPath(role, '/users'),
      {
        params: {
          page: String(params.page ?? 1),
          limit: String(params.limit ?? 20),
          ...(params.search ? { search: params.search } : {}),
          ...(params.role ? { role: params.role } : {}),
          ...(params.status ? { status: params.status } : {}),
        },
      },
    );
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
  },

  async listListings(role: AdminApiRole, params: ListParams = {}): Promise<PaginatedResult<Listing>> {
    const response = await apiClient<Listing[] | PaginatedResult<Listing>>(
      adminApiPath(role, '/listings'),
      {
        params: {
          page: String(params.page ?? 1),
          limit: String(params.limit ?? 20),
          ...(params.search ? { search: params.search } : {}),
          ...(params.status ? { status: params.status } : {}),
          ...(params.categoryId ? { categoryId: params.categoryId } : {}),
          ...(params.sellerId ? { sellerId: params.sellerId } : {}),
        },
      },
    );
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
  },

  async approveListing(role: AdminApiRole, listingId: string): Promise<Listing> {
    const response = await apiClient<Listing>(
      `${adminApiPath(role, '/listings')}/${listingId}/approve`,
      { method: 'POST' },
    );
    return response.data;
  },

  async rejectListing(role: AdminApiRole, listingId: string, reason: string): Promise<Listing> {
    const response = await apiClient<Listing>(
      `${adminApiPath(role, '/listings')}/${listingId}/reject`,
      { method: 'POST', body: JSON.stringify({ reason }) },
    );
    return response.data;
  },

  async removeListing(role: AdminApiRole, listingId: string, reason?: string): Promise<Listing> {
    const response = await apiClient<Listing>(
      `${adminApiPath(role, '/listings')}/${listingId}/remove`,
      { method: 'POST', body: JSON.stringify({ reason }) },
    );
    return response.data;
  },

  async restoreListing(
    role: AdminApiRole,
    listingId: string,
    targetStatus: 'expired' | 'draft' = 'expired',
  ): Promise<Listing> {
    const response = await apiClient<Listing>(
      `${adminApiPath(role, '/listings')}/${listingId}/restore`,
      { method: 'POST', body: JSON.stringify({ targetStatus }) },
    );
    return response.data;
  },

  async listListingModerationQueue(
    role: AdminApiRole,
    queue: 'pending' | 'flagged' | 'rejected' | 'removed',
    params: { page?: number; limit?: number } = {},
  ): Promise<PaginatedResult<Listing>> {
    const path = `${adminApiPath(role, '/listings')}/${queue}`;
    const response = await apiClient<Listing[] | PaginatedResult<Listing>>(path, {
      params: {
        page: String(params.page ?? 1),
        limit: String(params.limit ?? 20),
      },
    });
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
  },

  async approveListingModeration(role: AdminApiRole, listingId: string): Promise<Listing> {
    const response = await apiClient<Listing>(adminApiPath(role, '/listings/approve'), {
      method: 'POST',
      body: JSON.stringify({ listingId }),
    });
    return response.data;
  },

  async rejectListingModeration(
    role: AdminApiRole,
    listingId: string,
    reason: string,
  ): Promise<Listing> {
    const response = await apiClient<Listing>(adminApiPath(role, '/listings/reject'), {
      method: 'POST',
      body: JSON.stringify({ listingId, reason }),
    });
    return response.data;
  },

  async removeListingModeration(
    role: AdminApiRole,
    listingId: string,
    reason: string,
  ): Promise<Listing> {
    const response = await apiClient<Listing>(adminApiPath(role, '/listings/remove'), {
      method: 'POST',
      body: JSON.stringify({ listingId, reason }),
    });
    return response.data;
  },

  async investigateListing(
    role: AdminApiRole,
    listingId: string,
    reason?: string,
  ): Promise<Listing> {
    const response = await apiClient<Listing>(adminApiPath(role, '/listings/investigate'), {
      method: 'POST',
      body: JSON.stringify({ listingId, ...(reason ? { reason } : {}) }),
    });
    return response.data;
  },

  async getListingStatusHistory(role: AdminApiRole, listingId: string) {
    const response = await apiClient(
      `${adminApiPath(role, '/listings')}/${listingId}/status-history`,
    );
    return response.data;
  },

  async getListing(role: AdminApiRole, listingId: string): Promise<Listing> {
    const response = await apiClient<Listing>(`${adminApiPath(role, '/listings')}/${listingId}`);
    return response.data;
  },

  async getListingReview(role: AdminApiRole, listingId: string): Promise<ListingReviewContext> {
    const response = await apiClient<ListingReviewContext>(
      `${adminApiPath(role, '/listings')}/${listingId}/review`,
    );
    return response.data;
  },

  async sendListingReviewMessage(
    role: AdminApiRole,
    listingId: string,
    content: string,
  ): Promise<ListingReviewContext> {
    const response = await apiClient<ListingReviewContext>(
      `${adminApiPath(role, '/listings')}/${listingId}/review/messages`,
      { method: 'POST', body: JSON.stringify({ content }) },
    );
    return response.data;
  },

  async requestListingChanges(
    role: AdminApiRole,
    listingId: string,
    content: string,
  ): Promise<ListingReviewContext> {
    const response = await apiClient<ListingReviewContext>(
      `${adminApiPath(role, '/listings')}/${listingId}/request-changes`,
      { method: 'POST', body: JSON.stringify({ content }) },
    );
    return response.data;
  },

  async listPayments(role: AdminApiRole, params: ListParams = {}): Promise<PaginatedResult<Payment>> {
    const response = await apiClient<Payment[] | PaginatedResult<Payment>>(
      adminApiPath(role, '/payments'),
      {
        params: {
          page: String(params.page ?? 1),
          limit: String(params.limit ?? 20),
        },
      },
    );
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
  },

  async listModerationReports(
    role: AdminApiRole,
    params: ListParams = {},
  ): Promise<PaginatedResult<ModerationReport>> {
    const response = await apiClient<ModerationReport[] | PaginatedResult<ModerationReport>>(
      adminApiPath(role, '/moderation/reports'),
      {
        params: {
          page: String(params.page ?? 1),
          limit: String(params.limit ?? 20),
        },
      },
    );
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
  },

  async listPendingVerifications(
    role: AdminApiRole,
    params: ListParams = {},
  ): Promise<PaginatedResult<UserVerification>> {
    const response = await apiClient<UserVerification[] | PaginatedResult<UserVerification>>(
      adminApiPath(role, '/users/verifications/pending'),
      {
        params: {
          page: String(params.page ?? 1),
          limit: String(params.limit ?? 20),
        },
      },
    );
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
  },

  async listAuditLogs(role: AdminApiRole): Promise<unknown[]> {
    const response = await apiClient<unknown[]>(adminApiPath(role, '/audit'));
    return Array.isArray(response.data) ? response.data : [];
  },

  async listAdmins(params: ListParams = {}): Promise<PaginatedResult<UserProfile>> {
    const response = await apiClient<UserProfile[] | PaginatedResult<UserProfile>>(
      adminApiPath('SUPER_ADMIN', '/admins'),
      {
        params: {
          page: String(params.page ?? 1),
          limit: String(params.limit ?? 20),
        },
      },
    );
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
  },

  async listInviteableRoles(): Promise<AdminInviteableRoleRow[]> {
    const response = await apiClient<AdminInviteableRoleRow[]>(
      `${API_NAMESPACES.SUPER_ADMIN}/invitations/inviteable-roles`,
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  async listAdminInvitations(): Promise<AdminInvitationRow[]> {
    const response = await apiClient<AdminInvitationRow[]>(
      `${API_NAMESPACES.SUPER_ADMIN}/invitations`,
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  async createAdminInvitation(input: CreateAdminInvitationInput): Promise<AdminInvitationRow> {
    const response = await apiClient<AdminInvitationRow>(
      `${API_NAMESPACES.SUPER_ADMIN}/invitations`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    if (!response.data) {
      throw new Error('Failed to create invitation');
    }
    return response.data;
  },

  async resendAdminInvitation(id: string): Promise<{ message: string }> {
    const response = await apiClient<{ message: string }>(
      `${API_NAMESPACES.SUPER_ADMIN}/invitations/${id}/resend`,
      { method: 'POST' },
    );
    return response.data ?? { message: 'Invitation resent' };
  },

  async revokeAdminInvitation(id: string): Promise<{ revoked: boolean }> {
    const response = await apiClient<{ revoked: boolean }>(
      `${API_NAMESPACES.SUPER_ADMIN}/invitations/${id}`,
      { method: 'DELETE' },
    );
    return response.data ?? { revoked: true };
  },

  async getRoleMatrix(role: AdminApiRole): Promise<Record<RbacRole, string[]>> {
    if (role === 'SUPER_ADMIN') {
      const response = await apiClient<Record<RbacRole, string[]>>(
        adminApiPath(role, '/roles/matrix'),
      );
      return response.data ?? ({} as Record<RbacRole, string[]>);
    }

    const rolesResponse = await apiClient<Array<{ id: string; code: RbacRole }>>(
      adminApiPath(role, '/rbac/roles'),
    );
    const roles = Array.isArray(rolesResponse.data) ? rolesResponse.data : [];
    const matrix = {} as Record<RbacRole, string[]>;

    await Promise.all(
      roles.map(async (rbacRole) => {
        const permsResponse = await apiClient<Array<{ code: string } | string>>(
          adminApiPath(role, `/rbac/roles/${rbacRole.id}/permissions`),
        );
        const permissions = Array.isArray(permsResponse.data) ? permsResponse.data : [];
        matrix[rbacRole.code] = permissions.map((permission) =>
          typeof permission === 'string' ? permission : permission.code,
        );
      }),
    );

    return matrix;
  },

  async listRbacRoles(role: AdminApiRole): Promise<AdminRbacRoleRow[]> {
    const response = await apiClient<AdminRbacRoleRow[]>(adminApiPath(role, '/rbac/roles'));
    return Array.isArray(response.data) ? response.data : [];
  },

  async listRbacPermissions(role: AdminApiRole): Promise<AdminRbacPermissionRow[]> {
    const response = await apiClient<AdminRbacPermissionRow[]>(
      adminApiPath(role, '/rbac/permissions'),
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  async listRbacScopes(role: AdminApiRole): Promise<AdminRbacScopeRow[]> {
    const response = await apiClient<AdminRbacScopeRow[]>(adminApiPath(role, '/rbac/scopes'));
    return Array.isArray(response.data) ? response.data : [];
  },

  async getRbacRolePermissions(role: AdminApiRole, roleId: string): Promise<string[]> {
    const response = await apiClient<{ permissions: Array<{ id: string; code: string }> }>(
      adminApiPath(role, `/rbac/roles/${roleId}/permissions`),
    );
    const permissions = response.data?.permissions ?? [];
    return permissions.map((p) => p.code);
  },

  async createRbacRole(role: AdminApiRole, input: CreateAdminRoleInput) {
    const response = await apiClient<AdminRbacRoleRow>(adminApiPath(role, '/rbac/roles'), {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return response.data;
  },

  async updateRbacRole(
    role: AdminApiRole,
    roleId: string,
    input: { name?: string; description?: string },
  ) {
    const response = await apiClient<AdminRbacRoleRow>(
      adminApiPath(role, `/rbac/roles/${roleId}`),
      {
        method: 'PUT',
        body: JSON.stringify(input),
      },
    );
    return response.data;
  },

  async deleteRbacRole(role: AdminApiRole, roleId: string) {
    await apiClient(adminApiPath(role, `/rbac/roles/${roleId}`), { method: 'DELETE' });
  },

  async syncRbacRolePermissions(role: AdminApiRole, roleId: string, permissionIds: string[]) {
    const response = await apiClient<{ permissionIds: string[] }>(
      adminApiPath(role, `/rbac/roles/${roleId}/permissions`),
      {
        method: 'PUT',
        body: JSON.stringify({ permissionIds }),
      },
    );
    return response.data;
  },

  async approveVerification(role: AdminApiRole, verificationId: string, reason?: string) {
    const response = await apiClient<UserVerification>(
      adminApiPath(role, `/users/verifications/${verificationId}/approve`),
      {
        method: 'POST',
        body: JSON.stringify(reason ? { reason } : {}),
      },
    );
    return response.data;
  },

  async rejectVerification(role: AdminApiRole, verificationId: string, reason?: string) {
    const response = await apiClient<UserVerification>(
      adminApiPath(role, `/users/verifications/${verificationId}/reject`),
      {
        method: 'POST',
        body: JSON.stringify(reason ? { reason } : {}),
      },
    );
    return response.data;
  },

  async getModerationReport(role: AdminApiRole, reportId: string) {
    const response = await apiClient<ModerationReportDetail>(
      adminApiPath(role, `/moderation/reports/${reportId}`),
    );
    return response.data;
  },

  async takeModerationAction(
    role: AdminApiRole,
    reportId: string,
    input: {
      actionType: ModerationActionType;
      suspensionDuration?: SuspensionDuration;
      notes?: string;
      warnMessage?: string;
      autoHideListing?: boolean;
    },
  ) {
    const response = await apiClient<ModerationAction>(
      adminApiPath(role, `/moderation/reports/${reportId}/actions`),
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return response.data;
  },

  async suspendUser(role: AdminApiRole, userId: string, reason?: string) {
    const response = await apiClient<UserProfile>(adminApiPath(role, '/users/suspend'), {
      method: 'POST',
      body: JSON.stringify({ userId, ...(reason ? { reason } : {}) }),
    });
    return response.data;
  },

  async banUser(
    role: AdminApiRole,
    userId: string,
    type: 'temporary' | 'permanent',
    reason?: string,
    expiresAt?: string,
  ) {
    const response = await apiClient<UserProfile>(adminApiPath(role, '/users/ban'), {
      method: 'POST',
      body: JSON.stringify({
        userId,
        type,
        ...(reason ? { reason } : {}),
        ...(expiresAt ? { expiresAt } : {}),
      }),
    });
    return response.data;
  },

  async getUserDetails(role: AdminApiRole, userId: string) {
    const response = await apiClient<{
      profile: UserProfile;
      activeBans: UserBan[];
    }>(adminApiPath(role, `/users/${userId}`));
    return response.data;
  },

  async unsuspendUser(role: AdminApiRole, userId: string) {
    const response = await apiClient<{ userId: string; status: string }>(
      adminApiPath(role, `/users/${userId}/unsuspend`),
      { method: 'POST' },
    );
    return response.data;
  },

  async unbanUser(role: AdminApiRole, userId: string, banId: string) {
    const response = await apiClient<{ userId: string; banId: string; lifted: boolean }>(
      adminApiPath(role, `/users/${userId}/bans/${banId}/unban`),
      { method: 'POST' },
    );
    return response.data;
  },

  async getPlatformSettings(): Promise<PlatformSettings | null> {
    try {
      const response = await apiClient<PlatformSettings>(adminApiPath('SUPER_ADMIN', '/settings'));
      return response.data ?? null;
    } catch {
      return null;
    }
  },

  async updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const response = await apiClient<PlatformSettings>(adminApiPath('SUPER_ADMIN', '/settings'), {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
    return response.data ?? (settings as PlatformSettings);
  },

  async getSearchHealth(role: AdminApiRole): Promise<SearchHealthResponse | null> {
    try {
      const response = await apiClient<SearchHealthResponse>(adminApiPath(role, '/search/health'));
      return response.data ?? null;
    } catch {
      return null;
    }
  },

  async triggerSearchReindex(role: AdminApiRole, type: SearchIndexName): Promise<ReindexJobStatus> {
    const response = await apiClient<ReindexJobStatus>(adminApiPath(role, '/search/reindex'), {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
    if (!response.data) {
      throw new Error('Reindex request failed');
    }
    return response.data;
  },

  async getSearchReindexStatus(
    role: AdminApiRole,
    type: SearchIndexName,
  ): Promise<ReindexJobStatus | null> {
    try {
      const response = await apiClient<ReindexJobStatus>(
        adminApiPath(role, `/search/reindex/${type}/status`),
      );
      return response.data ?? null;
    } catch {
      return null;
    }
  },

  async getModerationAnalytics(
    role: AdminApiRole,
    days = 30,
  ): Promise<ModerationAnalytics | null> {
    try {
      const response = await apiClient<ModerationAnalytics>(
        adminApiPath(role, '/moderation/analytics'),
        { params: { days: String(days) } },
      );
      return response.data ?? null;
    } catch {
      return null;
    }
  },

  async listNotificationLogs(
    role: AdminApiRole,
    params: ListParams = {},
  ): Promise<PaginatedResult<AdminNotificationLogEntry>> {
    const response = await apiClient<AdminNotificationLogEntry[] | PaginatedResult<AdminNotificationLogEntry>>(
      adminApiPath(role, '/notifications/logs'),
      {
        params: {
          page: String(params.page ?? 1),
          limit: String(params.limit ?? 20),
        },
      },
    );
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
  },

  async listDisputes(
    role: AdminApiRole,
    params: { page?: number; limit?: number; status?: string } = {},
  ): Promise<PaginatedResult<MarketplaceDispute>> {
    const response = await apiClient<MarketplaceDispute[] | PaginatedResult<MarketplaceDispute>>(
      adminApiPath(role, '/disputes'),
      {
        params: {
          page: String(params.page ?? 1),
          limit: String(params.limit ?? 20),
          ...(params.status ? { status: params.status } : {}),
        },
      },
    );
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
  },

  async getDispute(role: AdminApiRole, disputeId: string): Promise<MarketplaceDispute> {
    const response = await apiClient<MarketplaceDispute>(
      adminApiPath(role, `/disputes/${disputeId}`),
    );
    return response.data;
  },

  async requestDisputeEvidence(
    role: AdminApiRole,
    disputeId: string,
    notes?: string,
  ): Promise<MarketplaceDispute> {
    const response = await apiClient<MarketplaceDispute>(
      adminApiPath(role, `/disputes/${disputeId}/request-evidence`),
      {
        method: 'POST',
        body: JSON.stringify(notes ? { notes } : {}),
      },
    );
    return response.data;
  },

  async markDisputeUnderReview(
    role: AdminApiRole,
    disputeId: string,
  ): Promise<MarketplaceDispute> {
    const response = await apiClient<MarketplaceDispute>(
      adminApiPath(role, `/disputes/${disputeId}/under-review`),
      { method: 'POST', body: JSON.stringify({}) },
    );
    return response.data;
  },

  async resolveDispute(
    role: AdminApiRole,
    disputeId: string,
    input: {
      outcome: 'resolved_buyer_favored' | 'resolved_seller_favored' | 'closed';
      resolutionNotes: string;
    },
  ): Promise<MarketplaceDispute> {
    const response = await apiClient<MarketplaceDispute>(
      adminApiPath(role, `/disputes/${disputeId}/resolve`),
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return response.data;
  },
};

export type AdminServiceRole = Extract<RbacRole, 'SUPER_ADMIN' | 'ADMIN'>;

export interface AdminRbacRoleRow {
  id: string;
  code: string;
  name: string;
  description?: string;
  isSystem: boolean;
  userCount?: number;
}

export interface AdminRbacPermissionRow {
  id: string;
  code: string;
  name: string;
  scope?: string | null;
}

export interface AdminRbacScopeRow {
  id: string;
  label: string;
  description: string;
  managementPermission: string;
  permissionCount: number;
}

export interface CreateAdminRoleInput {
  name: string;
  code?: string;
  description?: string;
  template?: RbacRoleTemplateId;
}

export interface AdminInviteableRoleRow {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
}

export interface AdminInvitationRow {
  id: string;
  email: string;
  displayName: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateAdminInvitationInput {
  email: string;
  displayName: string;
  roleId: string;
}
