import type {
  BuyerTrustProfile,
  PendingReviewItem,
  SellerTrustProfile,
} from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';

export const trustService = {
  async getSellerTrust(sellerId: string): Promise<SellerTrustProfile> {
    const response = await apiClient<SellerTrustProfile>(
      `${WEB_API_ROUTES.public.listings}/sellers/${sellerId}/trust`,
    );
    return response.data ?? { sellerId, reviewCount: 0, soldCount: 0 };
  },

  async getMyBuyerTrust(): Promise<BuyerTrustProfile> {
    const response = await apiClient<BuyerTrustProfile>(WEB_API_ROUTES.buyer.trustMe);
    return response.data!;
  },

  async getBuyerTrustForSeller(buyerId: string): Promise<BuyerTrustProfile> {
    const response = await apiClient<BuyerTrustProfile>(WEB_API_ROUTES.buyer.trustProfile(buyerId));
    return response.data!;
  },

  async getPendingBuyerReviews(): Promise<PendingReviewItem[]> {
    const response = await apiClient<PendingReviewItem[]>(WEB_API_ROUTES.buyer.reviewsPending);
    return Array.isArray(response.data) ? response.data : [];
  },

  async getPendingSellerReviews(): Promise<PendingReviewItem[]> {
    const response = await apiClient<PendingReviewItem[]>(WEB_API_ROUTES.seller.reviewsPending);
    return Array.isArray(response.data) ? response.data : [];
  },

  createBuyerReview(body: { listingId: string; buyerId: string; rating: number; comment?: string }) {
    return apiClient(WEB_API_ROUTES.seller.reviews, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};
