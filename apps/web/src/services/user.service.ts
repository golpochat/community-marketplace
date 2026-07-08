import type {
  ListingUploadUrlResponse,
  OtpSentResponse,
  UserEffectivePermissions,
  UserProfile,
  UserSettings,
} from '@community-marketplace/types';

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

  async updateMySettings(input: Record<string, unknown>): Promise<UserSettings> {
    const response = await apiClient<UserSettings>(WEB_API_ROUTES.users.meSettings, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return response.data;
  },

  async createAvatarUploadUrl(file: Pick<File, 'type' | 'name'>) {
    const response = await apiClient<ListingUploadUrlResponse>(WEB_API_ROUTES.users.meAvatarUploadUrl, {
      method: 'POST',
      body: JSON.stringify({ contentType: file.type, fileName: file.name }),
    });
    return response.data;
  },

  async uploadAvatar(file: File): Promise<UserProfile> {
    const upload = await this.createAvatarUploadUrl(file);
    const putResponse = await fetch(upload.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    if (!putResponse.ok) {
      throw new Error('Failed to upload store logo');
    }
    const response = await apiClient<UserProfile>(WEB_API_ROUTES.users.meAvatar, {
      method: 'PATCH',
      body: JSON.stringify({ publicUrl: upload.publicUrl }),
    });
    return response.data;
  },

  async createStoreBannerUploadUrl(file: Pick<File, 'type' | 'name'>) {
    const response = await apiClient<ListingUploadUrlResponse>(
      WEB_API_ROUTES.users.meStoreBannerUploadUrl,
      {
        method: 'POST',
        body: JSON.stringify({ contentType: file.type, fileName: file.name }),
      },
    );
    return response.data;
  },

  async uploadStoreBanner(file: File): Promise<UserProfile> {
    const upload = await this.createStoreBannerUploadUrl(file);
    const putResponse = await fetch(upload.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    if (!putResponse.ok) {
      throw new Error('Failed to upload storefront banner');
    }
    const response = await apiClient<UserProfile>(WEB_API_ROUTES.users.meStoreBanner, {
      method: 'PATCH',
      body: JSON.stringify({ publicUrl: upload.publicUrl }),
    });
    return response.data;
  },

  async sendPhoneChangeOtp(phone: string): Promise<Pick<OtpSentResponse, 'message' | 'devCode'>> {
    const response = await apiClient<Pick<OtpSentResponse, 'message' | 'devCode'>>(
      WEB_API_ROUTES.users.mePhoneSendOtp,
      {
        method: 'POST',
        body: JSON.stringify({ phone }),
      },
    );
    return response.data;
  },

  async verifyPhoneChange(phone: string, code: string): Promise<UserProfile> {
    const response = await apiClient<UserProfile>(WEB_API_ROUTES.users.mePhoneVerify, {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
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
