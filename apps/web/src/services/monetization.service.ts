import type {
  BuyerWalletSummary,
  CashbackEstimate,
  CashbackGrant,
  MonetizationSettings,
  SellerPlatformFeeInfo,
  WalletTransaction,
} from '@community-marketplace/types';
import type { PaginatedResult } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { adminApiPath, type AdminApiRole } from '@/lib/admin-api-routes';
import { WEB_API_ROUTES } from '@/lib/api-routes';
import { normalizePaginated } from '@/lib/normalize-api-response';

export const monetizationService = {
  async getBuyerWallet(): Promise<BuyerWalletSummary> {
    const response = await apiClient<BuyerWalletSummary>('/buyer/wallet');
    return response.data!;
  },

  async estimateCashback(listingId: string): Promise<CashbackEstimate> {
    const response = await apiClient<CashbackEstimate>(
      `/buyer/wallet/cashback-estimate?listingId=${encodeURIComponent(listingId)}`,
    );
    return response.data!;
  },

  async getSellerPlatformFee(): Promise<SellerPlatformFeeInfo> {
    const response = await apiClient<SellerPlatformFeeInfo>(
      `${WEB_API_ROUTES.seller.earnings}/platform-fee`,
    );
    return response.data!;
  },

  async getMonetizationSettings(role: AdminApiRole): Promise<MonetizationSettings> {
    const response = await apiClient<MonetizationSettings>(
      adminApiPath(role, '/monetization/settings'),
    );
    return response.data!;
  },

  async updateMonetizationSettings(
    role: AdminApiRole,
    body: Partial<MonetizationSettings>,
  ): Promise<MonetizationSettings> {
    const response = await apiClient<MonetizationSettings>(
      adminApiPath(role, '/monetization/settings'),
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
    return response.data!;
  },

  async setSellerFeeOverride(
    role: AdminApiRole,
    body: { userId: string; customPlatformFeePercent: number | null; reason?: string },
  ) {
    const response = await apiClient(
      adminApiPath(role, '/monetization/seller-fee-override'),
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
    return response.data;
  },

  async listCashbackGrants(
    role: AdminApiRole,
    params: { page?: number; limit?: number; status?: string; userId?: string } = {},
  ): Promise<PaginatedResult<CashbackGrant>> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    if (params.userId) query.set('userId', params.userId);
    const response = await apiClient<CashbackGrant[]>(
      `${adminApiPath(role, '/monetization/cashback-grants')}?${query.toString()}`,
    );
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
  },

  async listWalletTransactions(
    role: AdminApiRole,
    params: { page?: number; limit?: number; userId?: string; type?: string } = {},
  ): Promise<PaginatedResult<WalletTransaction>> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.userId) query.set('userId', params.userId);
    if (params.type) query.set('type', params.type);
    const response = await apiClient<WalletTransaction[]>(
      `${adminApiPath(role, '/monetization/wallet-transactions')}?${query.toString()}`,
    );
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
  },
};
