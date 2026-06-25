import type {
  Listing,
  ListingSummary,
  PaginatedResult,
  UserProfile,
  UserVerification,
} from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';
import { normalizePaginated } from '@/lib/normalize-api-response';

export const sellerService = {
  async getListings(page = 1, limit = 20, status?: string): Promise<PaginatedResult<Listing>> {
    const response = await apiClient<Listing[] | PaginatedResult<Listing>>(
      WEB_API_ROUTES.seller.listings,
      {
        params: {
          page: String(page),
          limit: String(limit),
          ...(status ? { status } : {}),
        },
      },
    );
    return normalizePaginated(response, { page, limit });
  },

  getSoldListings(page = 1, limit = 20) {
    return apiClient<PaginatedResult<Listing>>(`${WEB_API_ROUTES.seller.listings}/sold`, {
      params: { page: String(page), limit: String(limit) },
    }).then((res) => normalizePaginated(res, { page, limit }));
  },

  getAnalyticsSummary: () => apiClient(WEB_API_ROUTES.seller.listingsAnalyticsSummary),

  createListing(body: Record<string, unknown>) {
    return apiClient<Listing>(WEB_API_ROUTES.seller.listings, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getEarnings: () => apiClient(WEB_API_ROUTES.seller.earnings),

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient<UserProfile>(WEB_API_ROUTES.seller.profile);
    return response.data;
  },

  async updateProfile(body: Record<string, unknown>): Promise<UserProfile> {
    const response = await apiClient<UserProfile>(WEB_API_ROUTES.seller.profile, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return response.data;
  },

  getVerification: () => apiClient<UserVerification | null>(`${WEB_API_ROUTES.seller.profile}/verification`),

  submitVerification(body: Record<string, unknown>) {
    return apiClient<UserVerification>(`${WEB_API_ROUTES.seller.profile}/verification`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};

export const buyerService = {
  async getFavorites(page = 1, limit = 20): Promise<PaginatedResult<ListingSummary>> {
    const response = await apiClient<ListingSummary[] | PaginatedResult<ListingSummary>>(
      WEB_API_ROUTES.buyer.favorites,
      { params: { page: String(page), limit: String(limit) } },
    );
    return normalizePaginated(response, { page, limit });
  },

  addFavorite(listingId: string) {
    return apiClient(`${WEB_API_ROUTES.buyer.favorites}/${listingId}`, { method: 'POST' });
  },

  removeFavorite(listingId: string) {
    return apiClient(`${WEB_API_ROUTES.buyer.favorites}/${listingId}`, { method: 'DELETE' });
  },

  getPayments: () => apiClient(WEB_API_ROUTES.buyer.payments),

  createPaymentIntent(body: unknown) {
    return apiClient(WEB_API_ROUTES.buyer.paymentsIntent, { method: 'POST', body: JSON.stringify(body) });
  },

  getReviews: () => apiClient(WEB_API_ROUTES.buyer.reviews),

  createReview(body: unknown) {
    return apiClient(WEB_API_ROUTES.buyer.reviews, { method: 'POST', body: JSON.stringify(body) });
  },

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient<UserProfile>(WEB_API_ROUTES.buyer.profile);
    return response.data;
  },

  async updateProfile(body: Record<string, unknown>): Promise<UserProfile> {
    const response = await apiClient<UserProfile>(WEB_API_ROUTES.buyer.profile, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return response.data;
  },
};
