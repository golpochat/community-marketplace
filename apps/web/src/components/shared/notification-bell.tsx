'use client';

import Link from 'next/link';

import { NotificationBell as DashboardNotificationBell } from '@community-marketplace/ui-dashboard';
import { cn } from '@community-marketplace/ui';
import { Bell } from 'lucide-react';

import { useNotificationUnread } from '@/providers/notification-unread-provider';

interface NotificationBellProps {
  href: string;
  className?: string;
  /** `site` uses marketplace header tokens; `dashboard` uses dashboard shell tokens. */
  variant?: 'site' | 'dashboard';
}

export function NotificationBell({
  href,
  className,
  variant = 'dashboard',
}: NotificationBellProps) {
  const { unreadCount } = useNotificationUnread();

  if (variant === 'site') {
    return (
      <Link
        href={href}
        className={cn(
          'relative inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-primary',
          className,
        )}
        aria-label={
          unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
        }
      >
        <Bell className="h-6 w-6" strokeWidth={1.75} aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <DashboardNotificationBell
      href={href}
      unreadCount={unreadCount}
      className={className}
    />
  );
}
