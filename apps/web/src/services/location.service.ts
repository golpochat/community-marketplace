import type { NearbyArea, ReverseGeocodeResult } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';

export const locationService = {
  async getNearbyAreas(params: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    limit?: number;
  }): Promise<NearbyArea[]> {
    const response = await apiClient<NearbyArea[]>('/listings/nearby-areas', {
      params: {
        latitude: String(params.latitude),
        longitude: String(params.longitude),
        ...(params.radiusKm != null ? { radiusKm: String(params.radiusKm) } : {}),
        ...(params.limit != null ? { limit: String(params.limit) } : {}),
      },
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  async reverseGeocode(params: {
    latitude: number;
    longitude: number;
  }): Promise<ReverseGeocodeResult | null> {
    try {
      const response = await apiClient<ReverseGeocodeResult>('/listings/reverse-geocode', {
        params: {
          latitude: String(params.latitude),
          longitude: String(params.longitude),
        },
      });
      return response.data ?? null;
    } catch {
      return null;
    }
  },
};
