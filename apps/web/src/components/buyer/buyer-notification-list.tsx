'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Notification } from '@community-marketplace/types';

import { NotificationList } from '@/components/notifications/notification-list';
import { asArray } from '@/lib/normalize-api-response';
import { notificationsService } from '@/services/notifications.service';

export function BuyerNotificationList() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificationsService.listBuyer();
      setItems(asArray<Notification>(result.notifications));
      setUnreadCount(result.unreadCount);
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleMarkRead(id: string) {
    await notificationsService.markReadBuyer(id);
    await load();
  }

  async function handleMarkAllRead() {
    await notificationsService.markAllReadBuyer();
    await load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </p>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="text-sm text-primary hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>
      <NotificationList
        items={items}
        loading={loading}
        onMarkRead={(id) => void handleMarkRead(id)}
      />
    </div>
  );
}
