import type {
  AdminSellerVerificationDetail,
  AdminSellerVerificationRow,
  AdminSellerVerificationView,
  PaginatedResult,
  SellerStatusHistoryEntry,
} from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { normalizePaginated } from '@/lib/normalize-api-response';

export type AdminServiceRole = 'ADMIN' | 'SUPER_ADMIN';

export type AdminSellerListParams = {
  page?: number;
  limit?: number;
  view?: AdminSellerVerificationView;
  search?: string;
  fromDate?: string;
  toDate?: string;
  track?: 'all' | 'fast_track' | 'standard';
};

async function adminPath(role: AdminServiceRole, path: string) {
  const { adminApiPath } = await import('@/lib/admin-api-routes');
  return adminApiPath(role, path);
}

export const adminSellerVerificationService = {
  async list(
    role: AdminServiceRole,
    params: AdminSellerListParams = {},
  ): Promise<PaginatedResult<AdminSellerVerificationRow>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const response = await apiClient<
      AdminSellerVerificationRow[] | PaginatedResult<AdminSellerVerificationRow>
    >(await adminPath(role, '/seller-verification/requests'), {
      params: {
        page: String(page),
        limit: String(limit),
        view: params.view ?? 'pending',
        ...(params.search ? { search: params.search } : {}),
        ...(params.fromDate ? { fromDate: params.fromDate } : {}),
        ...(params.toDate ? { toDate: params.toDate } : {}),
        ...(params.track && params.track !== 'all' ? { track: params.track } : {}),
      },
    });
    return normalizePaginated(response, { page, limit });
  },

  async getRequestDetail(
    role: AdminServiceRole,
    requestId: string,
  ): Promise<AdminSellerVerificationDetail> {
    const response = await apiClient<AdminSellerVerificationDetail>(
      await adminPath(role, `/seller-verification/requests/${requestId}`),
    );
    return response.data;
  },

  async getSellerDetail(
    role: AdminServiceRole,
    userId: string,
  ): Promise<AdminSellerVerificationDetail> {
    const response = await apiClient<AdminSellerVerificationDetail>(
      await adminPath(role, `/seller-verification/sellers/${userId}`),
    );
    return response.data;
  },

  approve(role: AdminServiceRole, requestId: string) {
    return adminPath(role, '/seller-verification/approve').then((path) =>
      apiClient(path, {
        method: 'POST',
        body: JSON.stringify({ requestId }),
      }),
    );
  },

  reject(role: AdminServiceRole, requestId: string, reason: string) {
    return adminPath(role, '/seller-verification/reject').then((path) =>
      apiClient(path, {
        method: 'POST',
        body: JSON.stringify({ requestId, reason }),
      }),
    );
  },

  suspendSeller(
    role: AdminServiceRole,
    body: {
      userId: string;
      reason?: string;
      duration?: '7_days' | '30_days' | 'permanent';
    },
  ) {
    return adminPath(role, '/seller/suspend').then((path) =>
      apiClient(path, { method: 'POST', body: JSON.stringify(body) }),
    );
  },

  setSellerLimit(
    role: AdminServiceRole,
    body: { userId: string; sellerLimit: number; reason?: string },
  ) {
    return adminPath(role, '/seller/limit').then((path) =>
      apiClient(path, { method: 'POST', body: JSON.stringify(body) }),
    );
  },

  requestReverification(
    role: AdminServiceRole,
    userId: string,
    reason: string,
  ) {
    return adminPath(role, '/seller/force-reverify').then((path) =>
      apiClient(path, {
        method: 'POST',
        body: JSON.stringify({ userId, reason }),
      }),
    );
  },

  forceReverify(
    role: AdminServiceRole,
    body: { userId: string; reason: string },
  ) {
    return adminPath(role, '/seller/force-reverify').then((path) =>
      apiClient(path, { method: 'POST', body: JSON.stringify(body) }),
    );
  },

  async getStatusHistory(
    role: AdminServiceRole,
    userId: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedResult<SellerStatusHistoryEntry>> {
    const response = await apiClient<
      SellerStatusHistoryEntry[] | PaginatedResult<SellerStatusHistoryEntry>
    >(await adminPath(role, `/seller/status-history/${userId}`), {
      params: { page: String(page), limit: String(limit) },
    });
    return normalizePaginated(response, { page, limit });
  },

  reactivateSeller(
    role: AdminServiceRole,
    body: { userId: string; reason: string },
  ) {
    return adminPath(role, '/seller/reactivate').then((path) =>
      apiClient(path, { method: 'POST', body: JSON.stringify(body) }),
    );
  },
};
