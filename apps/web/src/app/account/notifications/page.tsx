'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Notification } from '@community-marketplace/types';
import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { NotificationList } from '@/components/notifications/notification-list';
import { asArray } from '@/lib/normalize-api-response';
import { notifyNotificationsUpdated } from '@/lib/notification-unread-events';
import { notificationsHeaderDescription } from '@/lib/notifications-header';
import { useSellerOnboarding } from '@/providers/seller-onboarding-provider';
import { notificationsService } from '@/services/notifications.service';

export default function AccountNotificationsPage() {
  const { snapshot } = useSellerOnboarding();
  const inboxRole = snapshot?.started || snapshot?.hasStorefront ? 'SELLER' : 'BUYER';
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result =
        inboxRole === 'SELLER'
          ? await notificationsService.listSeller()
          : await notificationsService.listBuyer();
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
  }, [inboxRole]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleMarkRead(id: string) {
    if (inboxRole === 'SELLER') {
      await notificationsService.markReadSeller(id);
    } else {
      await notificationsService.markReadBuyer(id);
    }
    await load();
  }

  async function handleMarkAllRead() {
    if (inboxRole === 'SELLER') {
      await notificationsService.markAllReadSeller();
    } else {
      await notificationsService.markAllReadBuyer();
    }
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
          variant="dashboard"
          onMarkRead={(id) => void handleMarkRead(id)}
        />
      </DashboardCard>
    </>
  );
}
