import type { Notification, NotificationPreferences } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';

export const notificationsService = {
  async list(page = 1, limit = 20, unreadOnly = false) {
    return apiClient<Notification[]>(WEB_API_ROUTES.buyer.notifications, {
      params: {
        page: String(page),
        limit: String(limit),
        ...(unreadOnly ? { unreadOnly: 'true' } : {}),
      },
    });
  },

  async getPreferences() {
    const response = await apiClient<NotificationPreferences>(
      WEB_API_ROUTES.buyer.notificationPreferences,
    );
    return response.data;
  },

  async updatePreferences(preferences: Partial<NotificationPreferences>) {
    const response = await apiClient<NotificationPreferences>(
      WEB_API_ROUTES.buyer.notificationPreferences,
      {
        method: 'PATCH',
        body: JSON.stringify(preferences),
      },
    );
    return response.data;
  },

  async markRead(notificationId: string) {
    const response = await apiClient<Notification>(WEB_API_ROUTES.buyer.notificationsRead, {
      method: 'PATCH',
      body: JSON.stringify({ notificationId }),
    });
    return response.data;
  },

  async markAllRead() {
    await apiClient(WEB_API_ROUTES.buyer.notificationsReadAll, { method: 'PATCH' });
  },

  async deleteNotification(notificationId: string) {
    await apiClient(`${WEB_API_ROUTES.buyer.notifications}/${notificationId}`, {
      method: 'DELETE',
    });
  },
};
