import type {
  FraudSignal,
  FraudSignalListItem,
  HighRiskListingSummary,
  HighRiskUserSummary,
  PaginatedResult,
} from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { adminApiPath, type AdminApiRole } from '@/lib/admin-api-routes';
import { normalizePaginated } from '@/lib/normalize-api-response';

export const adminFraudService = {
  async listHighRiskUsers(
    role: AdminApiRole,
    params: { page?: number; limit?: number; minRiskScore?: number } = {},
  ): Promise<PaginatedResult<HighRiskUserSummary>> {
    const response = await apiClient<HighRiskUserSummary[] | PaginatedResult<HighRiskUserSummary>>(
      adminApiPath(role, '/fraud/high-risk-users'),
      {
        params: {
          page: String(params.page ?? 1),
          limit: String(params.limit ?? 20),
          ...(params.minRiskScore != null
            ? { minRiskScore: String(params.minRiskScore) }
            : {}),
        },
      },
    );
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
  },

  async listHighRiskListings(
    role: AdminApiRole,
    params: { page?: number; limit?: number; minRiskScore?: number } = {},
  ): Promise<PaginatedResult<HighRiskListingSummary>> {
    const response = await apiClient<
      HighRiskListingSummary[] | PaginatedResult<HighRiskListingSummary>
    >(adminApiPath(role, '/fraud/high-risk-listings'), {
      params: {
        page: String(params.page ?? 1),
        limit: String(params.limit ?? 20),
        ...(params.minRiskScore != null ? { minRiskScore: String(params.minRiskScore) } : {}),
      },
    });
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
  },

  async listSignals(
    role: AdminApiRole,
    params: {
      page?: number;
      limit?: number;
      userId?: string;
      listingId?: string;
      signalType?: string;
      status?: 'active' | 'dismissed' | 'escalated' | 'all';
    } = {},
  ): Promise<PaginatedResult<FraudSignalListItem>> {
    const response = await apiClient<FraudSignalListItem[] | PaginatedResult<FraudSignalListItem>>(
      adminApiPath(role, '/fraud/signals'),
      {
        params: {
          page: String(params.page ?? 1),
          limit: String(params.limit ?? 20),
          ...(params.userId ? { userId: params.userId } : {}),
          ...(params.listingId ? { listingId: params.listingId } : {}),
          ...(params.signalType ? { signalType: params.signalType } : {}),
          ...(params.status ? { status: params.status } : {}),
        },
      },
    );
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
  },

  async getUserBreakdown(role: AdminApiRole, userId: string): Promise<HighRiskUserSummary> {
    const response = await apiClient<HighRiskUserSummary>(
      adminApiPath(role, `/fraud/users/${userId}/breakdown`),
    );
    return response.data;
  },

  async markSafe(
    role: AdminApiRole,
    input: { userId: string; listingId?: string; signalIds?: string[]; notes?: string },
  ) {
    return apiClient(adminApiPath(role, '/fraud/mark-safe'), {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async escalate(
    role: AdminApiRole,
    input: { userId: string; listingId?: string; notes?: string },
  ) {
    return apiClient(adminApiPath(role, '/fraud/escalate'), {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
