import type {
  ListingTitleState,
  TitleChangeLog,
  TitleUpdateResult,
} from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';
import { adminApiPath } from '@/lib/admin-api-routes';
import type { AdminApiRole } from '@/lib/admin-api-routes';

export const titleAmendService = {
  async getSellerState(listingId: string): Promise<ListingTitleState> {
    const response = await apiClient<ListingTitleState>(
      `${WEB_API_ROUTES.seller.listings}/${listingId}/title`,
    );
    return (
      response.data ?? {
        liveTitle: '',
        titleReviewStatus: 'none',
        titleAmendRequired: false,
      }
    );
  },

  async updateTitle(listingId: string, title: string): Promise<TitleUpdateResult> {
    const response = await apiClient<TitleUpdateResult>(
      `${WEB_API_ROUTES.seller.listings}/${listingId}/title/update`,
      {
        method: 'POST',
        body: JSON.stringify({ title }),
      },
    );
    return response.data;
  },

  async listPendingReviews(role: AdminApiRole, page = 1, limit = 20) {
    return apiClient(`${adminApiPath(role, '/title-reviews')}`, {
      params: { page: String(page), limit: String(limit) },
    });
  },

  async approveReview(role: AdminApiRole, changeLogId: string, reviewNotes?: string) {
    return apiClient(`${adminApiPath(role, `/title-reviews/${changeLogId}/approve`)}`, {
      method: 'POST',
      body: JSON.stringify({ reviewNotes }),
    });
  },

  async rejectReview(role: AdminApiRole, changeLogId: string, reviewNotes?: string) {
    return apiClient(`${adminApiPath(role, `/title-reviews/${changeLogId}/reject`)}`, {
      method: 'POST',
      body: JSON.stringify({ reviewNotes }),
    });
  },
};

export type { TitleChangeLog };
