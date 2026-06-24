import type { AdminDashboardStats, UserProfile } from '@community-marketplace/types';

import { ADMIN_API_ROUTES, moderationRoutes } from '@/lib/api-routes';
import { getServerAdminContext, serverAdminApiClient } from '@/lib/server-api-client';

function routesForRole(role: 'SUPER_ADMIN' | 'ADMIN') {
  return role === 'SUPER_ADMIN' ? ADMIN_API_ROUTES.superAdmin : ADMIN_API_ROUTES.admin;
}

async function resolveRole(): Promise<'SUPER_ADMIN' | 'ADMIN'> {
  const { role } = await getServerAdminContext();
  return role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
}

export const adminServerService = {
  async getStats(): Promise<AdminDashboardStats> {
    try {
      const role = await resolveRole();
      return await serverAdminApiClient<AdminDashboardStats>(routesForRole(role).stats);
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

  async getUsers() {
    const role = await resolveRole();
    return serverAdminApiClient<{ data: UserProfile[] }>(routesForRole(role).users);
  },

  async getListings() {
    const role = await resolveRole();
    const result = await serverAdminApiClient<{
      data: Array<{ id: string; title: string; price: number; locationLabel?: string; status: string }>;
    }>(routesForRole(role).listings);
    const listings = Array.isArray(result) ? result : (result.data ?? []);
    return listings.map((l) => ({
      ...l,
      price: Number(l.price),
      status: l.status ?? 'active',
    }));
  },

  async getPendingVerifications() {
    return serverAdminApiClient(ADMIN_API_ROUTES.admin.verificationsPending);
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

  async getModerationAppeals() {
    const role = await resolveRole();
    const ns = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
    return serverAdminApiClient(moderationRoutes(ns).appeals);
  },

  async getModerationAnalytics() {
    const role = await resolveRole();
    const ns = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
    return serverAdminApiClient(moderationRoutes(ns).analytics);
  },

  async getSearchAnalytics() {
    const role = await resolveRole();
    return serverAdminApiClient(routesForRole(role).search.analytics);
  },
};
