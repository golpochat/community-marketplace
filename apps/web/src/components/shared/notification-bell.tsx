'use client';

import { useCallback, useEffect, useState } from 'react';

import type { RbacRole } from '@community-marketplace/types';
import { NotificationBell as DashboardNotificationBell } from '@community-marketplace/ui-dashboard';

import { useAuth } from '@/hooks/use-auth';
import { notificationsService } from '@/services/notifications.service';

interface NotificationBellProps {
  href: string;
  role?: RbacRole;
}

function isInboxRole(role: RbacRole | null | undefined): role is 'BUYER' | 'SELLER' {
  return role === 'BUYER' || role === 'SELLER';
}

export function NotificationBell({ href, role: roleProp }: NotificationBellProps) {
  const { user } = useAuth();
  const role = roleProp ?? user?.role;
  const [unreadCount, setUnreadCount] = useState(0);

  const loadCount = useCallback(async () => {
    if (!isInboxRole(role)) {
      setUnreadCount(0);
      return;
    }

    try {
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
