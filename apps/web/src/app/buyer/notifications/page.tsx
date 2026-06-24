'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Notification } from '@community-marketplace/types';
import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { NotificationList } from '@/components/notifications/notification-list';
import { asArray } from '@/lib/normalize-api-response';
import { notificationsService } from '@/services/notifications.service';

export default function BuyerNotificationsPage() {
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
    <>
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
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
          variant="dashboard"
          onMarkRead={(id) => void handleMarkRead(id)}
        />
      </DashboardCard>
    </>
  );
}
