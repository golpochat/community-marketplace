import type { SellerStorefront } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { MOCK_STOREFRONTS } from '@/lib/mock-data';

export const storefrontService = {
  async getBySlug(slug: string): Promise<SellerStorefront | null> {
    try {
      const response = await apiClient<SellerStorefront>(`/stores/${slug}`);
      return response.data;
    } catch {
      return MOCK_STOREFRONTS[slug] ?? null;
    }
  },
};
