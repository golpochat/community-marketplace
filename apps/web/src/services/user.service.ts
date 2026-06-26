import type { UserEffectivePermissions, UserProfile, UserSettings } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';

export const userService = {
  async getMyProfile(): Promise<UserProfile> {
    const response = await apiClient<UserProfile>(WEB_API_ROUTES.users.me);
    return response.data;
  },

  async getMyPermissions(): Promise<UserEffectivePermissions> {
    const response = await apiClient<UserEffectivePermissions>(WEB_API_ROUTES.users.mePermissions);
    return response.data;
  },

  async getMySettings(): Promise<UserSettings> {
    const response = await apiClient<UserSettings>(WEB_API_ROUTES.users.meSettings);
    return response.data;
  },

  async updateMyProfile(input: Record<string, unknown>): Promise<UserProfile> {
    const response = await apiClient<UserProfile>(WEB_API_ROUTES.users.me, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return response.data;
  },

  async requestAccountDeactivation(): Promise<{ message: string; deletionRequestedAt?: string }> {
    const response = await apiClient<{ message: string; deletionRequestedAt?: string }>(
      `${WEB_API_ROUTES.users.meSettings}/delete-request`,
      { method: 'POST' },
    );
    return response.data;
  },
};
