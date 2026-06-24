import { paginationSchema } from '@community-marketplace/validation';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';

export interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  description?: string;
}

export const listingsService = {
  async getAll(page = 1, limit = 20): Promise<Listing[]> {
    const { page: p, limit: l } = paginationSchema.parse({ page, limit });

    try {
      const response = await apiClient<Listing[]>(WEB_API_ROUTES.public.listings, {
        params: { page: String(p), limit: String(l) },
      });
      return response.data;
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<Listing | null> {
    try {
      const response = await apiClient<Listing>(`${WEB_API_ROUTES.public.listings}/${id}`);
      return response.data;
    } catch {
      return null;
    }
  },
};
