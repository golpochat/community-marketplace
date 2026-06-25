import type {
  AdminDashboardStats,
  Listing,
  ModerationAction,
  ModerationActionType,
  ModerationReport,
  ModerationReportDetail,
  Payment,
  PlatformSettings,
  RbacRole,
  SuspensionDuration,
  UserProfile,
  UserVerification,
} from '@community-marketplace/types';
import type { PaginatedResult } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { adminApiPath, adminRoutesForRole, type AdminApiRole } from '@/lib/admin-api-routes';
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
        },
      },
    );
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
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

  async getSearchHealth(role: AdminApiRole): Promise<Record<string, unknown> | null> {
    try {
      const response = await apiClient<Record<string, unknown>>(adminApiPath(role, '/search/health'));
      return response.data ?? null;
    } catch {
      return null;
    }
  },

  async getModerationAnalytics(role: AdminApiRole): Promise<Record<string, unknown> | null> {
    try {
      const response = await apiClient<Record<string, unknown>>(
        adminApiPath(role, '/moderation/analytics'),
      );
      return response.data ?? null;
    } catch {
      return null;
    }
  },

  async listNotificationLogs(role: AdminApiRole, params: ListParams = {}): Promise<PaginatedResult<unknown>> {
    const response = await apiClient<unknown[] | PaginatedResult<unknown>>(
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
};

export type AdminServiceRole = Extract<RbacRole, 'SUPER_ADMIN' | 'ADMIN'>;
