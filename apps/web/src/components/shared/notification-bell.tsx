'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { notificationsService } from '@/services/notifications.service';

interface NotificationBellProps {
  href: string;
  role?: 'BUYER' | 'SELLER' | 'SUPER_ADMIN' | 'ADMIN';
}

export function NotificationBell({ href, role = 'BUYER' }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const loadCount = useCallback(async () => {
    try {
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
        setUnreadCount(0);
        return;
      }
      const result =
        role === 'SELLER'
          ? await notificationsService.listSeller(1, 1)
          : await notificationsService.listBuyer(1, 1);
      setUnreadCount(result.unreadCount);
    } catch {
      setUnreadCount(0);
    }
  }, [role]);

  useEffect(() => {
    void loadCount();
  }, [loadCount]);

  return (
    <Link href={href} className="relative inline-flex items-center p-2 text-gray-600 hover:text-gray-900">
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
