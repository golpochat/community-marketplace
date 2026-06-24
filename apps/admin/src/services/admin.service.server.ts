import type { RbacRole, UserProfile } from '@community-marketplace/types';

import { ADMIN_API_ROUTES, moderationRoutes } from '@/lib/api-routes';
import { getServerAdminContext, serverAdminApiClient } from '@/lib/server-api-client';

function routesForRole(role: RbacRole) {
  return role === 'SUPER_ADMIN' ? ADMIN_API_ROUTES.superAdmin : ADMIN_API_ROUTES.admin;
}

async function resolveRole(): Promise<RbacRole> {
  const { role } = await getServerAdminContext();
  return role ?? 'ADMIN';
}

export const adminServerService = {
  async getStats() {
    try {
      const role = await resolveRole();
      return await serverAdminApiClient<{
        totalUsers: number;
        activeListings: number;
        revenue: number;
        pendingReports: number;
      }>(routesForRole(role).stats);
    } catch {
      return { totalUsers: 0, activeListings: 0, revenue: 0, pendingReports: 0 };
    }
  },

  async getUsers(): Promise<UserProfile[]> {
    try {
      const role = await resolveRole();
      const result = await serverAdminApiClient<{ data: UserProfile[] }>(routesForRole(role).users);
      return result.data ?? [];
    } catch {
      return [];
    }
  },

  async getListings() {
    try {
      const role = await resolveRole();
      const result = await serverAdminApiClient<{
        data: Array<{ id: string; title: string; price: number; location: string; status: string }>;
      }>(routesForRole(role).listings);
      const listings = Array.isArray(result) ? result : (result.data ?? []);
      return listings.map((l) => ({ ...l, status: l.status ?? 'active' }));
    } catch {
      return [];
    }
  },

  async getModerationReports() {
    const role = await resolveRole();
    const ns = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
    return serverAdminApiClient(moderationRoutes(ns).reports);
  },

  async getModerationBans() {
    const role = await resolveRole();
    const ns = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
    return serverAdminApiClient(moderationRoutes(ns).bans);
  },
};
