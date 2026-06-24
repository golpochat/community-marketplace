'use client';

import { useCallback, useEffect, useState } from 'react';

import { NotificationBell as DashboardNotificationBell } from '@community-marketplace/ui-dashboard';

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

  return <DashboardNotificationBell href={href} unreadCount={unreadCount} />;
}
