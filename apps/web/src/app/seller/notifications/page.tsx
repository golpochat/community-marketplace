'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import type { Notification } from '@community-marketplace/types';
import { formatDateTime } from '@community-marketplace/utils';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

export default function SellerNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient<Notification[]>(WEB_API_ROUTES.seller.notifications);
      setNotifications(response.data ?? []);
      const meta = response.meta as { unreadCount?: number } | undefined;
      setUnreadCount(meta?.unreadCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleMarkRead(id: string) {
    await apiClient(WEB_API_ROUTES.seller.notificationsRead, {
      method: 'PATCH',
      body: JSON.stringify({ notificationId: id }),
    });
    await load();
  }

  async function handleMarkAllRead() {
    await apiClient(WEB_API_ROUTES.seller.notificationsReadAll, { method: 'PATCH' });
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        <Link href={WEB_APP_ROUTES.sellerDashboard} className="text-sm text-blue-600 hover:underline">
          Dashboard
        </Link>
      </div>

      {unreadCount > 0 && (
        <button
          type="button"
          onClick={() => void handleMarkAllRead()}
          className="mb-4 text-sm text-blue-600 hover:underline"
        >
          Mark all as read
        </button>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      {!loading && notifications.length === 0 && (
        <p className="text-sm text-gray-500">No notifications yet.</p>
      )}

      <ul className="space-y-2">
        {notifications.map((item) => (
          <li
            key={item.id}
            className={`rounded-md border px-3 py-2 text-sm ${
              item.read ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="mt-1 text-gray-600">{item.message ?? item.body}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {formatDateTime(item.createdAt)}
                </p>
              </div>
              {!item.read && (
                <button
                  type="button"
                  onClick={() => void handleMarkRead(item.id)}
                  className="shrink-0 text-xs text-blue-600 hover:underline"
                >
                  Mark read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
