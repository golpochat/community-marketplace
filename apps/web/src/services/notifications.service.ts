import type { Notification, NotificationPreferences, PaginationMeta } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';
import { notifyNotificationsUpdated } from '@/lib/notification-unread-events';
import { asArray, getUnreadCount } from '@/lib/normalize-api-response';

export interface NotificationsListResult {
  notifications: Notification[];
  unreadCount: number;
  meta: PaginationMeta;
}

function toListResult(
  response: Awaited<ReturnType<typeof apiClient<Notification[]>>>,
  fallback: { page: number; limit: number },
): NotificationsListResult {
  const notifications = asArray<Notification>(response.data);
  const meta = response.meta ?? {
    page: fallback.page,
    limit: fallback.limit,
    total: notifications.length,
  };

  return {
    notifications,
    unreadCount: getUnreadCount(meta) || notifications.filter((item) => !item.read).length,
    meta,
  };
}

export const notificationsService = {
  async getUnreadCount(role: 'BUYER' | 'SELLER'): Promise<number> {
    const path =
      role === 'SELLER'
        ? WEB_API_ROUTES.seller.notificationsUnreadCount
        : WEB_API_ROUTES.buyer.notificationsUnreadCount;
    try {
      const response = await apiClient<number>(path);
      return typeof response.data === 'number' ? response.data : 0;
    } catch {
      return 0;
    }
  },

  async listBuyer(page = 1, limit = 20, unreadOnly = false): Promise<NotificationsListResult> {
    const response = await apiClient<Notification[]>(WEB_API_ROUTES.buyer.notifications, {
      params: {
        page: String(page),
        limit: String(limit),
        ...(unreadOnly ? { unreadOnly: 'true' } : {}),
      },
    });
    return toListResult(response, { page, limit });
  },

  async listSeller(page = 1, limit = 20, unreadOnly = false): Promise<NotificationsListResult> {
    const response = await apiClient<Notification[]>(WEB_API_ROUTES.seller.notifications, {
      params: {
        page: String(page),
        limit: String(limit),
        ...(unreadOnly ? { unreadOnly: 'true' } : {}),
      },
    });
    return toListResult(response, { page, limit });
  },

  /** @deprecated Use listBuyer or listSeller */
  async list(page = 1, limit = 20, unreadOnly = false) {
    return this.listBuyer(page, limit, unreadOnly);
  },

  async getPreferences(role: 'BUYER' | 'SELLER' = 'BUYER') {
    const path =
      role === 'SELLER'
        ? WEB_API_ROUTES.seller.notificationPreferences
        : WEB_API_ROUTES.buyer.notificationPreferences;
    const response = await apiClient<NotificationPreferences>(path);
    return response.data;
  },

  async updatePreferences(
    preferences: Partial<NotificationPreferences>,
    role: 'BUYER' | 'SELLER' = 'BUYER',
  ) {
    const path =
      role === 'SELLER'
        ? WEB_API_ROUTES.seller.notificationPreferences
        : WEB_API_ROUTES.buyer.notificationPreferences;
    const response = await apiClient<NotificationPreferences>(path, {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
    return response.data;
  },

  async markReadBuyer(notificationId: string) {
    const response = await apiClient<Notification>(WEB_API_ROUTES.buyer.notificationsRead, {
      method: 'PATCH',
      body: JSON.stringify({ notificationId }),
    });
    const count = await this.getUnreadCount('BUYER');
    notifyNotificationsUpdated(count);
    return response.data;
  },

  async markAllReadBuyer() {
    await apiClient(WEB_API_ROUTES.buyer.notificationsReadAll, { method: 'PATCH' });
    notifyNotificationsUpdated(0);
  },

  async markReadSeller(notificationId: string) {
    const response = await apiClient<Notification>(WEB_API_ROUTES.seller.notificationsRead, {
      method: 'PATCH',
      body: JSON.stringify({ notificationId }),
    });
    const count = await this.getUnreadCount('SELLER');
    notifyNotificationsUpdated(count);
    return response.data;
  },

  async markAllReadSeller() {
    await apiClient(WEB_API_ROUTES.seller.notificationsReadAll, { method: 'PATCH' });
    notifyNotificationsUpdated(0);
  },

  /** @deprecated Use markReadBuyer */
  async markRead(notificationId: string) {
    return this.markReadBuyer(notificationId);
  },

  /** @deprecated Use markAllReadBuyer */
  async markAllRead() {
    return this.markAllReadBuyer();
  },

  async deleteNotification(notificationId: string) {
    await apiClient(`${WEB_API_ROUTES.buyer.notifications}/${notificationId}`, {
      method: 'DELETE',
    });
  },
};
