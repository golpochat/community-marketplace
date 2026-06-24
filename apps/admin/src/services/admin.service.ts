import type { RbacRole, UserProfile } from '@community-marketplace/types';

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
  async getStats(role?: RbacRole | null) {
    try {
      return await adminApiClient<{
        totalUsers: number;
        activeListings: number;
        revenue: number;
        pendingReports: number;
      }>(routesForRole(role).stats);
    } catch {
      return { totalUsers: 0, activeListings: 0, revenue: 0, pendingReports: 0 };
    }
  },

  async getUsers(role?: RbacRole | null): Promise<UserProfile[]> {
    try {
      const result = await adminApiClient<{ data: UserProfile[]; meta: { total: number } }>(
        routesForRole(role).users,
      );
      return result.data ?? [];
    } catch {
      return [];
    }
  },

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
};
