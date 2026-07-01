'use client';

import type { Notification } from '@community-marketplace/types';

import { EmptyState } from '@/components/shared/empty-state';
import { asArray } from '@/lib/normalize-api-response';
import { NotificationItem } from '@/components/notifications/notification-item';

interface NotificationListProps {
  /** Pre-normalized notification array from the parent page/service */
  items: Notification[];
  loading?: boolean;
  onMarkRead?: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  variant?: 'default' | 'dashboard';
}

export function NotificationList({
  items,
  loading,
  onMarkRead,
  emptyTitle = 'No notifications',
  emptyDescription = "You're all caught up.",
  variant = 'default',
}: NotificationListProps) {
  const safeItems = asArray<Notification>(items);

  if (loading) {
    return (
      <p
        className={
          variant === 'dashboard'
            ? 'text-sm text-[hsl(var(--dashboard-sidebar-muted))]'
            : 'text-sm text-muted-foreground'
        }
      >
        Loading notifications...
      </p>
    );
  }

  if (safeItems.length === 0) {
    return (
      <EmptyState
        variant={variant}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <ul className="space-y-2">
      {safeItems.map((item) => (
        <li key={item.id}>
          <NotificationItem notification={item} onMarkRead={onMarkRead} />
        </li>
      ))}
    </ul>
  );
}
