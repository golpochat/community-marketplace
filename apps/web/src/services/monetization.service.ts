import type {
  BoostCatalogResponse,
  BoostIntentResponse,
  BuyerStatementIntentResponse,
  BuyerStatementStatusResponse,
  BuyerWalletSummary,
  CashbackEstimate,
  CashbackGrant,
  FeaturedCatalogResponse,
  FeaturedIntentResponse,
  FastTrackIntentResponse,
  FastTrackStatusResponse,
  MonetizationSettings,
  PlatformPurchase,
  SellerPlatformFeeInfo,
  StoreSlotCatalogResponse,
  StoreSlotIntentResponse,
  WalletTransaction,
} from '@community-marketplace/types';
import type {
  CreateBoostIntentInput,
  CreateFeaturedIntentInput,
  CreateStoreSlotIntentInput,
  PlatformSettingsUpdateInput,
} from '@community-marketplace/validation';
import type { PaginatedResult } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { adminApiPath, type AdminApiRole } from '@/lib/admin-api-routes';
import { WEB_API_ROUTES } from '@/lib/api-routes';
import { downloadAuthenticatedFile } from '@/lib/download-file';
import { normalizePaginated } from '@/lib/normalize-api-response';

export type StatementExportFormat = 'pdf' | 'csv' | 'xlsx';

export interface AdminFinanceReportFilters {
  dateFrom: string;
  dateTo: string;
  categories?: Array<'buyer' | 'seller' | 'platform_service' | 'marketplace_fee'>;
  search?: string;
}

function buildAdminFinanceQuery(filters: AdminFinanceReportFilters): string {
  const params = new URLSearchParams({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
  if (filters.categories?.length) {
    params.set('categories', filters.categories.join(','));
  }
  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }
  return params.toString();
}

function statementPathSuffix(format: StatementExportFormat): string {
  if (format === 'pdf') return '';
  return format === 'csv' ? '/csv' : '/xlsx';
}

function statementFallbackFilename(prefix: string, year: number, month: number, format: StatementExportFormat): string {
  const ym = `${year}-${String(month).padStart(2, '0')}`;
  const ext = format === 'pdf' ? 'pdf' : format === 'csv' ? 'csv' : 'xlsx';
  return `${prefix}-${ym}.${ext}`;
}

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

  async getBoostCatalog(listingId: string): Promise<BoostCatalogResponse> {
    const response = await apiClient<BoostCatalogResponse>(
      `${WEB_API_ROUTES.seller.boostCatalog}?listingId=${encodeURIComponent(listingId)}`,
    );
    return response.data!;
  },

  async createBoostIntent(body: CreateBoostIntentInput): Promise<BoostIntentResponse> {
    const response = await apiClient<BoostIntentResponse>(WEB_API_ROUTES.seller.boostIntent, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.data!;
  },

  async confirmBoost(purchaseId: string): Promise<PlatformPurchase> {
    const response = await apiClient<PlatformPurchase>(WEB_API_ROUTES.seller.boostConfirm, {
      method: 'POST',
      body: JSON.stringify({ purchaseId }),
    });
    return response.data!;
  },

  async getFeaturedCatalog(listingId: string): Promise<FeaturedCatalogResponse> {
    const response = await apiClient<FeaturedCatalogResponse>(
      `${WEB_API_ROUTES.seller.featuredCatalog}?listingId=${encodeURIComponent(listingId)}`,
    );
    return response.data!;
  },

  async createFeaturedIntent(body: CreateFeaturedIntentInput): Promise<FeaturedIntentResponse> {
    const response = await apiClient<FeaturedIntentResponse>(WEB_API_ROUTES.seller.featuredIntent, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.data!;
  },

  async confirmFeatured(purchaseId: string): Promise<PlatformPurchase> {
    const response = await apiClient<PlatformPurchase>(WEB_API_ROUTES.seller.featuredConfirm, {
      method: 'POST',
      body: JSON.stringify({ purchaseId }),
    });
    return response.data!;
  },

  async getFastTrackStatus(): Promise<FastTrackStatusResponse> {
    const response = await apiClient<FastTrackStatusResponse>(WEB_API_ROUTES.seller.fastTrackStatus);
    return response.data!;
  },

  async createFastTrackIntent(): Promise<FastTrackIntentResponse> {
    const response = await apiClient<FastTrackIntentResponse>(WEB_API_ROUTES.seller.fastTrackIntent, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return response.data!;
  },

  async confirmFastTrack(purchaseId: string): Promise<PlatformPurchase> {
    const response = await apiClient<PlatformPurchase>(WEB_API_ROUTES.seller.fastTrackConfirm, {
      method: 'POST',
      body: JSON.stringify({ purchaseId }),
    });
    return response.data!;
  },

  async getStoreSlotCatalog(): Promise<StoreSlotCatalogResponse> {
    const response = await apiClient<StoreSlotCatalogResponse>(
      WEB_API_ROUTES.seller.storeSlotCatalog,
    );
    return response.data!;
  },

  async createStoreSlotIntent(body: CreateStoreSlotIntentInput): Promise<StoreSlotIntentResponse> {
    const response = await apiClient<StoreSlotIntentResponse>(WEB_API_ROUTES.seller.storeSlotIntent, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.data!;
  },

  async confirmStoreSlot(purchaseId: string): Promise<PlatformPurchase> {
    const response = await apiClient<PlatformPurchase>(WEB_API_ROUTES.seller.storeSlotConfirm, {
      method: 'POST',
      body: JSON.stringify({ purchaseId }),
    });
    return response.data!;
  },

  async getSellerPurchases(page = 1, limit = 20) {
    return apiClient<PlatformPurchase[]>(WEB_API_ROUTES.seller.earningsPurchases, {
      params: { page: String(page), limit: String(limit) },
    });
  },

  async downloadSellerInvoice(purchaseId: string, receiptNumber?: string) {
    const fallback = receiptNumber
      ? `invoice-${receiptNumber}.pdf`
      : `invoice-${purchaseId}.pdf`;
    await downloadAuthenticatedFile(
      `${WEB_API_ROUTES.seller.earningsPurchases}/${purchaseId}/invoice`,
      fallback,
    );
  },

  async downloadSellerStatement(year: number, month: number, format: StatementExportFormat = 'pdf') {
    await downloadAuthenticatedFile(
      `${WEB_API_ROUTES.seller.earningsStatement}${statementPathSuffix(format)}?year=${year}&month=${month}`,
      statementFallbackFilename('seller-statement', year, month, format),
    );
  },

  async getBuyerStatementStatus(year: number, month: number): Promise<BuyerStatementStatusResponse> {
    const response = await apiClient<BuyerStatementStatusResponse>(
      `${WEB_API_ROUTES.buyer.statementsStatus}?year=${year}&month=${month}`,
    );
    return response.data!;
  },

  async createBuyerStatementIntent(year: number, month: number): Promise<BuyerStatementIntentResponse> {
    const response = await apiClient<BuyerStatementIntentResponse>(
      WEB_API_ROUTES.buyer.statementsIntent,
      {
        method: 'POST',
        body: JSON.stringify({ year, month }),
      },
    );
    return response.data!;
  },

  async confirmBuyerStatement(purchaseId: string): Promise<PlatformPurchase> {
    const response = await apiClient<PlatformPurchase>(WEB_API_ROUTES.buyer.statementsConfirm, {
      method: 'POST',
      body: JSON.stringify({ purchaseId }),
    });
    return response.data!;
  },

  async downloadBuyerStatement(year: number, month: number, format: StatementExportFormat = 'pdf') {
    await downloadAuthenticatedFile(
      `${WEB_API_ROUTES.buyer.statementsDownload}${statementPathSuffix(format)}?year=${year}&month=${month}`,
      statementFallbackFilename('buyer-statement', year, month, format),
    );
  },

  async getMonetizationSettings(role: AdminApiRole): Promise<MonetizationSettings> {
    const response = await apiClient<MonetizationSettings>(
      adminApiPath(role, '/monetization/settings'),
    );
    return response.data!;
  },

  async updateMonetizationSettings(
    role: AdminApiRole,
    body: PlatformSettingsUpdateInput,
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

  async getFinanceReportSummary(role: AdminApiRole, filters: AdminFinanceReportFilters) {
    const response = await apiClient<{
      records: Array<{
        type: 'buyer_purchase' | 'seller_sale' | 'platform_service' | 'marketplace_fee';
        typeLabel: string;
        date: string;
        reference: string;
        party: string;
        partyEmail: string;
        description: string;
        amount: number;
        currency: string;
      }>;
      summary: {
        totalRevenueGross: number;
        currency: string;
      };
    }>(`${adminApiPath(role, '/finance/report/summary')}?${buildAdminFinanceQuery(filters)}`);
    return response.data!;
  },

  async downloadFinanceReport(
    role: AdminApiRole,
    filters: AdminFinanceReportFilters,
    format: StatementExportFormat,
  ) {
    const query = buildAdminFinanceQuery(filters);
    const ext = format === 'xlsx' ? 'xlsx' : format;
    await downloadAuthenticatedFile(
      `${adminApiPath(role, `/finance/report/${format}`)}?${query}`,
      `finance-report-${filters.dateFrom}_${filters.dateTo}.${ext}`,
    );
  },
};
