import type {
  DeliveryOption,
  DeliveryPreview,
  DeliveryUpdateResult,
  ListingDeliverySelection,
  ListingDeliveryState,
} from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';
import { adminApiPath } from '@/lib/admin-api-routes';
import type { AdminApiRole } from '@/lib/admin-api-routes';

export const deliveryService = {
  async getCatalog(): Promise<DeliveryOption[]> {
    const response = await apiClient<DeliveryOption[]>('/listings/delivery-options');
    return Array.isArray(response.data) ? response.data : [];
  },

  async getSellerState(listingId: string): Promise<ListingDeliveryState> {
    const response = await apiClient<ListingDeliveryState>(
      `${WEB_API_ROUTES.seller.listings}/${listingId}/delivery`,
    );
    return response.data ?? { deliveryOptions: [] };
  },

  async previewUpdate(
    listingId: string,
    selections: ListingDeliverySelection[],
  ): Promise<DeliveryPreview> {
    const response = await apiClient<DeliveryPreview>(
      `${WEB_API_ROUTES.seller.listings}/${listingId}/delivery/preview`,
      {
        method: 'POST',
        body: JSON.stringify({
          selections: selections.map((s) => ({
            deliveryOptionId: s.deliveryOptionId,
            customLabel: s.customLabel,
            customPrice: s.customPrice,
          })),
        }),
      },
    );
    return response.data;
  },

  async updateDelivery(
    listingId: string,
    selections: ListingDeliverySelection[],
  ): Promise<DeliveryUpdateResult> {
    const response = await apiClient<DeliveryUpdateResult>(
      `${WEB_API_ROUTES.seller.listings}/${listingId}/delivery/update`,
      {
        method: 'POST',
        body: JSON.stringify({
          selections: selections.map((s) => ({
            deliveryOptionId: s.deliveryOptionId,
            customLabel: s.customLabel,
            customPrice: s.customPrice,
          })),
        }),
      },
    );
    return response.data;
  },

  async listPendingReviews(role: AdminApiRole, page = 1, limit = 20) {
    return apiClient(`${adminApiPath(role, '/delivery-reviews')}`, {
      params: { page: String(page), limit: String(limit) },
    });
  },

  async approveReview(role: AdminApiRole, changeLogId: string, reviewNotes?: string) {
    return apiClient(`${adminApiPath(role, `/delivery-reviews/${changeLogId}/approve`)}`, {
      method: 'POST',
      body: JSON.stringify({ reviewNotes }),
    });
  },

  async rejectReview(role: AdminApiRole, changeLogId: string, reviewNotes?: string) {
    return apiClient(`${adminApiPath(role, `/delivery-reviews/${changeLogId}/reject`)}`, {
      method: 'POST',
      body: JSON.stringify({ reviewNotes }),
    });
  },
};
