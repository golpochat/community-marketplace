import type {
  Listing,
  ListingImage,
  ListingReviewContext,
  ListingSummary,
  ListingUploadUrlResponse,
  PaginatedResult,
  SellerStore,
  SellerStoresOverview,
  UserProfile,
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

  updateListing(id: string, body: Record<string, unknown>) {
    return apiClient<Listing>(`${WEB_API_ROUTES.seller.listings}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  deleteListing(id: string) {
    return apiClient<{ deleted: boolean }>(`${WEB_API_ROUTES.seller.listings}/${id}`, {
      method: 'DELETE',
    });
  },

  archiveListing(id: string) {
    return apiClient<Listing>(`${WEB_API_ROUTES.seller.listings}/${id}/archive`, {
      method: 'POST',
    });
  },

  markListingSold(id: string) {
    return apiClient<Listing>(`${WEB_API_ROUTES.seller.listings}/${id}/sold`, {
      method: 'POST',
    });
  },

  submitForReview(id: string) {
    return apiClient<Listing>(`${WEB_API_ROUTES.seller.listings}/${id}/submit`, { method: 'POST' });
  },

  publishListing(id: string) {
    return apiClient<Listing>(`${WEB_API_ROUTES.seller.listings}/${id}/publish`, { method: 'POST' });
  },

  cancelReview(id: string) {
    return apiClient<Listing>(`${WEB_API_ROUTES.seller.listings}/${id}/cancel-review`, {
      method: 'POST',
    });
  },

  pauseListing(id: string) {
    return apiClient<Listing>(`${WEB_API_ROUTES.seller.listings}/${id}/pause`, { method: 'POST' });
  },

  resumeListing(id: string) {
    return apiClient<Listing>(`${WEB_API_ROUTES.seller.listings}/${id}/resume`, { method: 'POST' });
  },

  endListing(id: string) {
    return apiClient<Listing>(`${WEB_API_ROUTES.seller.listings}/${id}/end`, { method: 'POST' });
  },

  renewListing(id: string, packageType = 'FREE') {
    return apiClient<Listing>(`${WEB_API_ROUTES.seller.listings}/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify({ packageType }),
    });
  },

  upgradePackage(id: string, packageType: string) {
    return apiClient<Listing>(`${WEB_API_ROUTES.seller.listings}/${id}/upgrade-package`, {
      method: 'POST',
      body: JSON.stringify({ packageType }),
    });
  },

  duplicateListing(id: string) {
    return apiClient<Listing>(`${WEB_API_ROUTES.seller.listings}/${id}/duplicate`, {
      method: 'POST',
    });
  },

  async requestListingImageUploadUrl(
    listingId: string,
    file: Pick<File, 'type' | 'name' | 'size'>,
  ): Promise<ListingUploadUrlResponse> {
    const response = await apiClient<ListingUploadUrlResponse>(
      `${WEB_API_ROUTES.seller.listings}/${listingId}/images/upload-url`,
      {
        method: 'POST',
        body: JSON.stringify({
          contentType: file.type,
          fileName: file.name,
          fileSizeBytes: file.size,
        }),
      },
    );
    return response.data;
  },

  async uploadListingImage(listingId: string, file: File): Promise<ListingImage[]> {
    const upload = await this.requestListingImageUploadUrl(listingId, file);
    const putResponse = await fetch(upload.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    if (!putResponse.ok) {
      throw new Error(`Image upload failed (${putResponse.status}). Is the API running on port 4000?`);
    }
    const response = await apiClient<ListingImage[]>(
      `${WEB_API_ROUTES.seller.listings}/${listingId}/images/confirm`,
      {
        method: 'POST',
        body: JSON.stringify({ keys: [upload.key] }),
      },
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  async uploadListingImages(listingId: string, files: File[]): Promise<ListingImage[]> {
    const results: ListingImage[] = [];
    for (const file of files) {
      const images = await this.uploadListingImage(listingId, file);
      results.push(...images);
    }
    return results;
  },

  async removeListingImage(listingId: string, imageId: string): Promise<void> {
    await apiClient(`${WEB_API_ROUTES.seller.listings}/${listingId}/images/${imageId}`, {
      method: 'DELETE',
    });
  },

  async reorderListingImages(
    listingId: string,
    images: ListingImage[],
  ): Promise<ListingImage[]> {
    const imageOrders = images.map((image, index) => ({
      imageId: image.id,
      order: index,
    }));
    const response = await apiClient<ListingImage[]>(
      `${WEB_API_ROUTES.seller.listings}/${listingId}/images/order`,
      {
        method: 'PATCH',
        body: JSON.stringify({ imageOrders }),
      },
    );
    return Array.isArray(response.data) ? response.data : [];
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

  async getStoresOverview(): Promise<SellerStoresOverview> {
    const response = await apiClient<SellerStoresOverview>(WEB_API_ROUTES.seller.stores);
    return response.data;
  },

  async getPrimaryStore(): Promise<SellerStore | null> {
    const response = await apiClient<SellerStore | null>(WEB_API_ROUTES.seller.storesPrimary);
    return response.data;
  },

  async createStore(body: Record<string, unknown>): Promise<SellerStore> {
    const response = await apiClient<SellerStore>(WEB_API_ROUTES.seller.stores, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.data;
  },

  async updateStore(storeId: string, body: Record<string, unknown>): Promise<SellerStore> {
    const response = await apiClient<SellerStore>(WEB_API_ROUTES.seller.store(storeId), {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return response.data;
  },

  async getListingReview(listingId: string): Promise<ListingReviewContext> {
    const response = await apiClient<ListingReviewContext>(
      `${WEB_API_ROUTES.seller.listings}/${listingId}/review`,
    );
    return response.data;
  },

  async sendListingReviewMessage(listingId: string, content: string): Promise<ListingReviewContext> {
    const response = await apiClient<ListingReviewContext>(
      `${WEB_API_ROUTES.seller.listings}/${listingId}/review/messages`,
      { method: 'POST', body: JSON.stringify({ content }) },
    );
    return response.data;
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

  reportListing(listingId: string, body: { reason: string; description?: string }) {
    return apiClient(WEB_API_ROUTES.buyer.listingReport(listingId), {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async isFavorite(listingId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites(1, 100);
      return favorites.data.some((item) => item.id === listingId);
    } catch {
      return false;
    }
  },
};
