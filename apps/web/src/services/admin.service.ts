import type { AdminDashboardStats, RbacRole } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { adminRoutesForRole } from '@/lib/admin-api-routes';

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

export const adminService = {
  async getStats(role: 'SUPER_ADMIN' | 'ADMIN'): Promise<AdminDashboardStats> {
    try {
      const response = await apiClient<AdminDashboardStats>(adminRoutesForRole(role).stats);
      return response.data ?? EMPTY_STATS;
    } catch {
      return EMPTY_STATS;
    }
  },
};

export type AdminServiceRole = Extract<RbacRole, 'SUPER_ADMIN' | 'ADMIN'>;
