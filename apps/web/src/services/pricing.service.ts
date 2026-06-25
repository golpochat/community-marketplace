import type {
  ListingPricingFields,
  ListingPricingState,
  PriceUpdateResult,
  PricingPreview,
} from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';
import { adminApiPath } from '@/lib/admin-api-routes';
import type { AdminApiRole } from '@/lib/admin-api-routes';

export interface PricingInput {
  originalPrice?: number;
  salePrice?: number;
  price?: number;
}

export const pricingService = {
  async getSellerState(listingId: string): Promise<ListingPricingState> {
    const response = await apiClient<ListingPricingState>(
      `${WEB_API_ROUTES.seller.listings}/${listingId}/pricing`,
    );
    return response.data ?? { pricing: { price: 0 } };
  },

  async previewUpdate(listingId: string, input: PricingInput): Promise<PricingPreview> {
    const response = await apiClient<PricingPreview>(
      `${WEB_API_ROUTES.seller.listings}/${listingId}/pricing/preview`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return response.data;
  },

  async updatePricing(listingId: string, input: PricingInput): Promise<PriceUpdateResult> {
    const response = await apiClient<PriceUpdateResult>(
      `${WEB_API_ROUTES.seller.listings}/${listingId}/pricing/update`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return response.data;
  },

  async listPendingReviews(role: AdminApiRole, page = 1, limit = 20) {
    return apiClient(`${adminApiPath(role, '/price-reviews')}`, {
      params: { page: String(page), limit: String(limit) },
    });
  },

  async approveReview(role: AdminApiRole, changeLogId: string, reviewNotes?: string) {
    return apiClient(`${adminApiPath(role, `/price-reviews/${changeLogId}/approve`)}`, {
      method: 'POST',
      body: JSON.stringify({ reviewNotes }),
    });
  },

  async rejectReview(role: AdminApiRole, changeLogId: string, reviewNotes?: string) {
    return apiClient(`${adminApiPath(role, `/price-reviews/${changeLogId}/reject`)}`, {
      method: 'POST',
      body: JSON.stringify({ reviewNotes }),
    });
  },
};

export function pricingInputFromForm(
  salePrice: string,
  originalPrice?: string,
): PricingInput {
  const sale = salePrice.trim() ? Number(salePrice) : undefined;
  const original = originalPrice?.trim() ? Number(originalPrice) : undefined;
  return {
    salePrice: sale,
    originalPrice: original,
    price: sale,
  };
}

export function formPricingFromFields(fields: ListingPricingFields) {
  return {
    salePrice: String(fields.salePrice ?? fields.price),
    originalPrice: fields.originalPrice != null ? String(fields.originalPrice) : '',
  };
}
