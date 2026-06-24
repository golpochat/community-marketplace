import type { AutocompleteSuggestion, GlobalSearchResults } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';

export const searchService = {
  async autocomplete(q: string, types = 'listing,category,seller', limit = 8) {
    const response = await apiClient<AutocompleteSuggestion[]>(WEB_API_ROUTES.public.autocomplete, {
      params: { q, types, limit: String(limit) },
    });
    return response.data ?? [];
  },

  async globalSearch(q: string, limit = 10) {
    const response = await apiClient<GlobalSearchResults>(WEB_API_ROUTES.public.globalSearch, {
      params: { q, limit: String(limit) },
    });
    return response.data;
  },

  async searchListings(params: Record<string, string>) {
    return apiClient(WEB_API_ROUTES.public.listingSearch, { params });
  },
};
