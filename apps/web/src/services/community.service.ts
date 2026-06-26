import type { ListingFeedType } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';

export interface CommunityPublicStats {
  memberCount: number;
  activeListings: number;
  soldToday: number;
  newListingsToday: number;
  verifiedSellers: number;
}

export const communityService = {
  async getStats(): Promise<CommunityPublicStats | null> {
    try {
      const response = await apiClient<CommunityPublicStats>('/listings/community-stats');
      return response.data ?? null;
    } catch {
      return null;
    }
  },
};

export interface FeedQuery {
  feed: ListingFeedType;
  latitude: number;
  longitude: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}
