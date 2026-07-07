'use client';

import Link from 'next/link';

import { cn } from '@community-marketplace/ui';
import { Bell } from 'lucide-react';

export interface NotificationBellProps {
  href: string;
  unreadCount?: number;
  className?: string;
}

export function NotificationBell({ href, unreadCount = 0, className }: NotificationBellProps) {
  const label =
    unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications';

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        'relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[hsl(var(--dashboard-sidebar-muted))] transition-colors',
        'hover:bg-[hsl(var(--dashboard-sidebar-active)/0.45)] hover:text-[hsl(var(--dashboard-topbar-fg))]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--dashboard-accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--dashboard-topbar-bg))]',
        className,
      )}
    >
      <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      {unreadCount > 0 ? (
        <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-[hsl(var(--dashboard-topbar-bg))]">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
