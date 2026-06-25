import type {
  AdminDashboardStats,
  ModerationAnalytics,
  PlatformSettings,
  RbacRole,
  UserProfile,
} from '@community-marketplace/types';

import { adminApiClient } from '@/lib/api-client';
import { ADMIN_API_ROUTES, moderationRoutes } from '@/lib/api-routes';
import { getStoredAdminRole } from '@/store/admin-auth.store';

function resolveRole(role?: RbacRole | null): RbacRole | null {
  return role ?? getStoredAdminRole();
}

function routesForRole(role?: RbacRole | null) {
  return resolveRole(role) === 'SUPER_ADMIN'
    ? ADMIN_API_ROUTES.superAdmin
    : ADMIN_API_ROUTES.admin;
}

function moderationRoutesForRole(role?: RbacRole | null) {
  const resolved = resolveRole(role);
  if (resolved !== 'SUPER_ADMIN' && resolved !== 'ADMIN') {
    return moderationRoutes('ADMIN');
  }
  return moderationRoutes(resolved);
}

export const adminService = {
  async getStats(role?: RbacRole | null): Promise<AdminDashboardStats> {
    try {
      return await adminApiClient<AdminDashboardStats>(routesForRole(role).stats);
    } catch {
      return {
        totalUsers: 0,
        totalSellers: 0,
        totalBuyers: 0,
        activeListings: 0,
        totalPayments: 0,
        pendingVerifications: 0,
        pendingReports: 0,
        activeBans: 0,
        revenue: 0,
        platformHealth: { database: 'healthy', search: 'degraded', payments: 'degraded' },
        generatedAt: new Date().toISOString(),
      };
    }
  },

  getUsers: (role?: RbacRole | null, query?: string) =>
    adminApiClient<{ data: UserProfile[]; meta: { total: number } }>(
      `${routesForRole(role).users}${query ? `?${query}` : ''}`,
    ),

  getUser: (id: string, role?: RbacRole | null) =>
    adminApiClient(ADMIN_API_ROUTES.admin.user(id)),

  suspendUser: (body: Record<string, unknown>) =>
    adminApiClient(ADMIN_API_ROUTES.admin.userSuspend, { method: 'POST', body: JSON.stringify(body) }),

  unsuspendUser: (id: string) =>
    adminApiClient(ADMIN_API_ROUTES.admin.userUnsuspend(id), { method: 'POST' }),

  banUser: (body: Record<string, unknown>) =>
    adminApiClient(ADMIN_API_ROUTES.admin.userBan, { method: 'POST', body: JSON.stringify(body) }),

  getPendingVerifications: (role?: RbacRole | null) =>
    adminApiClient(ADMIN_API_ROUTES.admin.verificationsPending),

  approveVerification: (id: string, body?: Record<string, unknown>) =>
    adminApiClient(ADMIN_API_ROUTES.admin.verificationApprove(id), {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),

  rejectVerification: (id: string, body: Record<string, unknown>) =>
    adminApiClient(ADMIN_API_ROUTES.admin.verificationReject(id), {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  async getListings(role?: RbacRole | null) {
    try {
      const result = await adminApiClient<{
        data: Array<{ id: string; title: string; price: number; location: string; status: string }>;
      }>(routesForRole(role).listings);
      const listings = Array.isArray(result) ? result : (result.data ?? []);
      return listings.map((l) => ({ ...l, status: l.status ?? 'active' }));
    } catch {
      return [];
    }
  },

  getModerationReports: (role?: RbacRole | null) =>
    adminApiClient(moderationRoutesForRole(role).reports),
  getModerationBans: (role?: RbacRole | null) =>
    adminApiClient(moderationRoutesForRole(role).bans),
  getModerationAppeals: (role?: RbacRole | null) =>
    adminApiClient(moderationRoutesForRole(role).appeals),
  getModerationAnalytics: (role?: RbacRole | null) =>
    adminApiClient<ModerationAnalytics>(moderationRoutesForRole(role).analytics),
  takeModerationAction: (
    reportId: string,
    body: Record<string, unknown>,
    role?: RbacRole | null,
  ) =>
    adminApiClient(moderationRoutesForRole(role).reportAction(reportId), {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  reviewAppeal: (appealId: string, body: Record<string, unknown>, role?: RbacRole | null) =>
    adminApiClient(moderationRoutesForRole(role).appeal(appealId), {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  getSearchIndexes: (role?: RbacRole | null) =>
    adminApiClient(routesForRole(role).search.indexes),
  getSearchHealth: (role?: RbacRole | null) => adminApiClient(routesForRole(role).search.health),
  getSearchAnalytics: (role?: RbacRole | null) =>
    adminApiClient(routesForRole(role).search.analytics),
  reindexSearch: (type: string, role?: RbacRole | null) =>
    adminApiClient(routesForRole(role).search.reindex, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),
  getReindexStatus: (type: string, role?: RbacRole | null) =>
    adminApiClient(routesForRole(role).search.reindexStatus(type)),

  updateSearchSynonyms: (body: unknown, role?: RbacRole | null) =>
    adminApiClient(routesForRole(role).search.synonyms, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateSearchStopWords: (body: unknown, role?: RbacRole | null) =>
    adminApiClient(routesForRole(role).search.stopWords, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateSearchRelevance: (body: unknown, role?: RbacRole | null) =>
    adminApiClient(routesForRole(role).search.relevance, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  getPayments: (query?: string) =>
    adminApiClient(`${ADMIN_API_ROUTES.admin.payments}${query ? `?${query}` : ''}`),

  getPendingRefunds: () => adminApiClient(ADMIN_API_ROUTES.admin.refundsPending),

  approveRefund: (body: unknown) =>
    adminApiClient(ADMIN_API_ROUTES.admin.refundsApprove, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getDisputes: () => adminApiClient(ADMIN_API_ROUTES.admin.disputes),

  getNotificationTemplates: () => adminApiClient(ADMIN_API_ROUTES.admin.notifications.templates),

  getNotificationProviders: () => adminApiClient(ADMIN_API_ROUTES.admin.notifications.providers),

  broadcastNotification: (body: unknown) =>
    adminApiClient(ADMIN_API_ROUTES.admin.notifications.broadcast, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getNotificationLogs: () => adminApiClient(ADMIN_API_ROUTES.admin.notifications.logs),

  getAuditLog: (role?: RbacRole | null) => adminApiClient(routesForRole(role).audit),

  getPlatformSettings: () => adminApiClient<PlatformSettings>(ADMIN_API_ROUTES.superAdmin.settings),

  updatePlatformSettings: (body: Partial<PlatformSettings>) =>
    adminApiClient<PlatformSettings>(ADMIN_API_ROUTES.superAdmin.settings, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  getAdmins: () => adminApiClient(ADMIN_API_ROUTES.superAdmin.admins),

  getRoleMatrix: () => adminApiClient(ADMIN_API_ROUTES.superAdmin.roleMatrix),

  banListing: (id: string, body?: unknown) =>
    adminApiClient(ADMIN_API_ROUTES.admin.listingBan(id), {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),

  unbanListing: (id: string) =>
    adminApiClient(ADMIN_API_ROUTES.admin.listingUnban(id), { method: 'POST' }),

  removeListing: (id: string, body?: unknown) =>
    adminApiClient(ADMIN_API_ROUTES.admin.listingBan(id), {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),

  restoreListing: (id: string) =>
    adminApiClient(ADMIN_API_ROUTES.admin.listingUnban(id), { method: 'POST' }),
};
