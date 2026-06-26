import type { ListingSortOption, StorefrontListing } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import type { SellerStorefront } from '@community-marketplace/types';
import { normalizePaginated } from '@/lib/normalize-api-response';

export type StorefrontSort = Extract<
  ListingSortOption,
  'newest' | 'price_low_to_high' | 'price_high_to_low'
>;

export const storefrontService = {
  async getBySlug(slug: string): Promise<SellerStorefront | null> {
    try {
      const response = await apiClient<SellerStorefront>(`/stores/${encodeURIComponent(slug)}`);
      return response.data;
    } catch {
      return null;
    }
  },

  async getListings(
    slug: string,
    sort: StorefrontSort = 'newest',
    page = 1,
    limit = 24,
  ) {
    const response = await apiClient<StorefrontListing[] | { data: StorefrontListing[] }>(
      `/stores/${encodeURIComponent(slug)}/listings`,
      {
        params: {
          sort,
          page: String(page),
          limit: String(limit),
        },
      },
    );
    return normalizePaginated(response, { page, limit });
  },
};
