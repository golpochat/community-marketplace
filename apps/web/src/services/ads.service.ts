import type {
  AdsSystemStatus,
  DisplayAdsPlacementsResponse,
} from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';
import { adminApiPath, type AdminApiRole } from '@/lib/admin-api-routes';

const EMPTY_PLACEMENTS: DisplayAdsPlacementsResponse = {
  enabled: false,
  preview: false,
  context: 'homepage',
  slots: [],
};

export const adsService = {
  async getPlacements(context = 'homepage'): Promise<DisplayAdsPlacementsResponse> {
    try {
      const response = await apiClient<DisplayAdsPlacementsResponse>(
        `${WEB_API_ROUTES.public.adsPlacements}?context=${encodeURIComponent(context)}`,
      );
      return response.data ?? EMPTY_PLACEMENTS;
    } catch {
      return { ...EMPTY_PLACEMENTS, context };
    }
  },

  async getAdsSystemStatus(role: AdminApiRole): Promise<AdsSystemStatus | null> {
    try {
      const response = await apiClient<AdsSystemStatus>(
        adminApiPath(role, '/monetization/ads-system'),
      );
      return response.data ?? null;
    } catch {
      return null;
    }
  },
};
