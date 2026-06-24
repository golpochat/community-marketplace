import type { UserEffectivePermissions, UserProfile, UserSettings } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { getStoredAccessToken } from '@/store/auth.store';
import { WEB_API_ROUTES } from '@/lib/api-routes';

function authHeaders(): HeadersInit {
  const token = getStoredAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const userService = {
  async getMyProfile(): Promise<UserProfile> {
    const response = await apiClient<UserProfile>(WEB_API_ROUTES.users.me, {
      headers: authHeaders(),
    });
    return response.data;
  },

  async getMyPermissions(): Promise<UserEffectivePermissions> {
    const response = await apiClient<UserEffectivePermissions>(
      WEB_API_ROUTES.users.mePermissions,
      { headers: authHeaders() },
    );
    return response.data;
  },

  async getMySettings(): Promise<UserSettings> {
    const response = await apiClient<UserSettings>(WEB_API_ROUTES.users.meSettings, {
      headers: authHeaders(),
    });
    return response.data;
  },

  async updateMyProfile(input: Record<string, unknown>): Promise<UserProfile> {
    const response = await apiClient<UserProfile>(WEB_API_ROUTES.users.me, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
    return response.data;
  },
};
