'use client';

import Link from 'next/link';

export interface NotificationBellProps {
  href: string;
  unreadCount?: number;
}

export function NotificationBell({ href, unreadCount = 0 }: NotificationBellProps) {
  return (
    <Link
      href={href}
      className="relative inline-flex items-center p-2 text-gray-600 hover:text-gray-900"
    >
      <span className="text-xl" aria-hidden>
        🔔
      </span>
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      <span className="sr-only">
        Notifications{unreadCount > 0 ? `, ${unreadCount} unread` : ''}
      </span>
    </Link>
  );
}
