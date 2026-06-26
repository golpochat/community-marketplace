'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

import type { RbacRole } from '@community-marketplace/types';

import {
  NOTIFICATIONS_UPDATED_EVENT,
  type NotificationsUpdatedDetail,
} from '@/lib/notification-unread-events';
import { notificationsService } from '@/services/notifications.service';
import { useAuthStore } from '@/store/auth.store';

const POLL_INTERVAL_MS = 30_000;

function isInboxRole(role: RbacRole | null | undefined): role is 'BUYER' | 'SELLER' {
  return role === 'BUYER' || role === 'SELLER';
}

interface NotificationUnreadContextValue {
  unreadCount: number;
  refresh: () => Promise<void>;
}

const NotificationUnreadContext = createContext<NotificationUnreadContextValue | null>(null);

export function NotificationUnreadProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const role = user?.role;
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isInboxRole(role)) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await notificationsService.getUnreadCount(role);
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, [role]);

  useEffect(() => {
    void refresh();
  }, [refresh, pathname, user?.id]);

  useEffect(() => {
    if (!isInboxRole(role)) return;

    function handleUpdate(event: Event) {
      const detail = (event as CustomEvent<NotificationsUpdatedDetail>).detail;
      if (detail?.unreadCount !== undefined) {
        setUnreadCount(detail.unreadCount);
        return;
      }
      void refresh();
    }

    function handleFocus() {
      void refresh();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    }

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [role, refresh]);

  const value = useMemo(
    () => ({ unreadCount, refresh }),
    [unreadCount, refresh],
  );

  return (
    <NotificationUnreadContext.Provider value={value}>
      {children}
    </NotificationUnreadContext.Provider>
  );
}

export function useNotificationUnread(_role?: RbacRole | null) {
  const context = useContext(NotificationUnreadContext);
  if (!context) {
    throw new Error('useNotificationUnread must be used within NotificationUnreadProvider');
  }
  return context;
}
