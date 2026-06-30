import type {
  CheckoutSessionResponse,
  Payment,
  PaymentIntentResponse,
  Payout,
  SellerEarningsSummary,
  StripeConnectAccount,
} from '@community-marketplace/types';
import { PLATFORM_COUNTRY_CODE } from '@community-marketplace/config';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';

export const paymentsService = {
  async createCheckoutSession(listingId: string) {
    const response = await apiClient<CheckoutSessionResponse>(
      WEB_API_ROUTES.buyer.checkoutCreateSession,
      {
        method: 'POST',
        body: JSON.stringify({ listingId }),
      },
    );
    return response.data;
  },

  async createPaymentIntent(listingId: string, method: 'card' | 'bank_transfer' | 'wallet' = 'card') {
    const response = await apiClient<PaymentIntentResponse>(WEB_API_ROUTES.buyer.paymentsIntent, {
      method: 'POST',
      body: JSON.stringify({ listingId, method }),
    });
    return response.data;
  },

  async confirmPayment(paymentId: string) {
    const response = await apiClient<Payment>(WEB_API_ROUTES.buyer.paymentsConfirm, {
      method: 'POST',
      body: JSON.stringify({ paymentId }),
    });
    return response.data;
  },

  async getBuyerHistory(page = 1, limit = 20) {
    return apiClient<Payment[]>(WEB_API_ROUTES.buyer.payments, {
      params: { page: String(page), limit: String(limit) },
    });
  },

  async getBuyerPayment(paymentId: string) {
    const response = await apiClient<Payment>(`${WEB_API_ROUTES.buyer.payments}/${paymentId}`);
    return response.data;
  },

  async requestRefund(paymentId: string, reason?: string) {
    const response = await apiClient(WEB_API_ROUTES.buyer.paymentsRefunds, {
      method: 'POST',
      body: JSON.stringify({ paymentId, reason }),
    });
    return response.data;
  },

  async getEarningsSummary() {
    const response = await apiClient<SellerEarningsSummary>(WEB_API_ROUTES.seller.earnings);
    return response.data;
  },

  async getPayoutHistory(page = 1, limit = 20) {
    return apiClient<Payout[]>(WEB_API_ROUTES.seller.earningsPayouts, {
      params: { page: String(page), limit: String(limit) },
    });
  },

  async getConnectStatus() {
    const response = await apiClient<StripeConnectAccount | null>(
      WEB_API_ROUTES.seller.connectStatus,
    );
    return response.data;
  },

  async startConnectOnboarding(returnUrl?: string, refreshUrl?: string) {
    const response = await apiClient<StripeConnectAccount>(WEB_API_ROUTES.seller.connectOnboard, {
      method: 'POST',
      body: JSON.stringify({
        country: PLATFORM_COUNTRY_CODE,
        returnUrl,
        refreshUrl,
      }),
    });
    return response.data;
  },

  async startConnectOnboardingAlias(returnUrl?: string, refreshUrl?: string) {
    const response = await apiClient<StripeConnectAccount>(
      WEB_API_ROUTES.seller.connectOnboardAlias,
      {
        method: 'POST',
        body: JSON.stringify({
          country: PLATFORM_COUNTRY_CODE,
          returnUrl,
          refreshUrl,
        }),
      },
    );
    return response.data;
  },

  async getConnectDashboardLink() {
    const response = await apiClient<{ url: string }>(WEB_API_ROUTES.seller.connectDashboard, {
      method: 'POST',
    });
    return response.data;
  },

  async getSellerPayments(page = 1, limit = 20) {
    return apiClient<Payment[]>(WEB_API_ROUTES.seller.earningsPayments, {
      params: { page: String(page), limit: String(limit) },
    });
  },

  async getPendingTransfers() {
    const response = await apiClient<
      Array<{
        paymentId: string;
        listingId: string;
        amount: number;
        platformFee: number;
        netAmount: number;
        currency: string;
        createdAt: string;
      }>
    >(WEB_API_ROUTES.seller.earningsPendingTransfers);
    return response.data ?? [];
  },
};
