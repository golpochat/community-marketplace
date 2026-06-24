import type { Category, Listing, ListingSearchFilters, ListingSummary, PaginatedResult } from '@community-marketplace/types';
import { paginationSchema } from '@community-marketplace/validation';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';
import { getMockListingSummaries, MOCK_CATEGORIES, MOCK_LISTINGS } from '@/lib/mock-data';
import { normalizePaginated } from '@/lib/normalize-api-response';

function toSearchParams(filters: ListingSearchFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.q) params.q = filters.q;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.minPrice != null) params.minPrice = String(filters.minPrice);
  if (filters.maxPrice != null) params.maxPrice = String(filters.maxPrice);
  if (filters.condition) params.condition = filters.condition;
  if (filters.sort) params.sort = filters.sort;
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);
  return params;
}

export const listingsService = {
  async search(filters: ListingSearchFilters = {}): Promise<PaginatedResult<ListingSummary>> {
    const { page = 1, limit = 12 } = paginationSchema.parse({
      page: filters.page ?? 1,
      limit: filters.limit ?? 12,
    });

    try {
      const response = await apiClient<ListingSummary[] | PaginatedResult<ListingSummary>>(
        WEB_API_ROUTES.public.listingSearch,
        {
          params: toSearchParams({ ...filters, page, limit }),
        },
      );
      return normalizePaginated(response, { page, limit });
    } catch {
      return getMockListingSummaries(page, limit);
    }
  },

  async getAll(page = 1, limit = 20): Promise<PaginatedResult<ListingSummary>> {
    const { page: p, limit: l } = paginationSchema.parse({ page, limit });

    try {
      const response = await apiClient<ListingSummary[] | PaginatedResult<ListingSummary>>(
        WEB_API_ROUTES.public.listings,
        {
          params: { page: String(p), limit: String(l) },
        },
      );
      return normalizePaginated(response, { page: p, limit: l });
    } catch {
      return getMockListingSummaries(p, l);
    }
  },

  async getById(id: string): Promise<Listing | null> {
    try {
      const response = await apiClient<Listing>(`${WEB_API_ROUTES.public.listings}/${id}`);
      return response.data;
    } catch {
      return MOCK_LISTINGS[id] ?? null;
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient<Category[]>(`${WEB_API_ROUTES.public.listings}/categories`);
      return response.data ?? [];
    } catch {
      return MOCK_CATEGORIES;
    }
  },

  async getSimilar(listingId: string, limit = 4): Promise<ListingSummary[]> {
    const listing = await this.getById(listingId);
    if (!listing) return [];

    const result = await this.search({ categoryId: listing.categoryId, limit: limit + 1 });
    return result.data.filter((l) => l.id !== listingId).slice(0, limit);
  },
};
