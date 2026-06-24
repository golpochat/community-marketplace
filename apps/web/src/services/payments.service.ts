import type {
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
};
