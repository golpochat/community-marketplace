import type {
  FeaturedStoreSummary,
  ListingSortOption,
  PaginatedResult,
  SellerStorefront,
  StorefrontListing,
} from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';
import { normalizePaginated } from '@/lib/normalize-api-response';

export type StorefrontSort = Extract<
  ListingSortOption,
  'newest' | 'price_low_to_high' | 'price_high_to_low'
>;

export const storefrontService = {
  async getFeaturedStores(limit = 6): Promise<FeaturedStoreSummary[]> {
    try {
      const response = await apiClient<FeaturedStoreSummary[]>(
        WEB_API_ROUTES.public.featuredStores,
        {
          params: { limit: String(limit) },
        },
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

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
    const response = await apiClient<StorefrontListing[] | PaginatedResult<StorefrontListing>>(
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
