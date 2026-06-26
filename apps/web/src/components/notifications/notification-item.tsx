import Link from 'next/link';

import type { Notification } from '@community-marketplace/types';
import { formatDateTime } from '@community-marketplace/utils';

import { NotificationIconByType } from '@/components/notifications/notification-icon-by-type';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const content = (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg">
        <NotificationIconByType type={notification.type} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900">{notification.title}</p>
        <p className="mt-0.5 text-sm text-gray-600">{notification.message ?? notification.body}</p>
        <p className="mt-1 text-xs text-gray-400">{formatDateTime(notification.createdAt)}</p>
      </div>
      {!notification.read && onMarkRead && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onMarkRead(notification.id);
          }}
          className="shrink-0 text-xs text-primary hover:underline"
        >
          Mark read
        </button>
      )}
    </div>
  );

  const className = `block rounded-lg border px-4 py-3 transition-colors ${
    notification.read ? 'border-gray-200 bg-white' : 'border-primary/20 bg-primary/5'
  }`;

  if (notification.actionUrl) {
    return (
      <Link
        href={notification.actionUrl}
        className={`${className} hover:bg-gray-50`}
        onClick={() => {
          if (!notification.read && onMarkRead) {
            onMarkRead(notification.id);
          }
        }}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
