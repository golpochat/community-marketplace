'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Notification } from '@community-marketplace/types';
import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { NotificationList } from '@/components/notifications/notification-list';
import { asArray } from '@/lib/normalize-api-response';
import { notifyNotificationsUpdated } from '@/lib/notification-unread-events';
import { notificationsHeaderDescription } from '@/lib/notifications-header';
import { notificationsService } from '@/services/notifications.service';

export default function SellerNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificationsService.listSeller();
      const notifications = asArray<Notification>(result.notifications);
      setItems(notifications);
      setUnreadCount(result.unreadCount);
      notifyNotificationsUpdated(result.unreadCount);
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
    await notificationsService.markReadSeller(id);
    await load();
  }

  async function handleMarkAllRead() {
    await notificationsService.markAllReadSeller();
    await load();
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description={notificationsHeaderDescription(unreadCount, items.length)}
      />
      <DashboardCard>
        {unreadCount > 0 && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              className="text-sm font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
            >
              Mark all read
            </button>
          </div>
        )}
        <NotificationList
          items={items}
          loading={loading}
          onMarkRead={(id) => void handleMarkRead(id)}
        />
      </DashboardCard>
    </>
  );
}
