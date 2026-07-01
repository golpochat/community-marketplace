'use client';

import Link from 'next/link';

import type { RbacRole } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';
import { Bell } from 'lucide-react';

import { useNotificationUnread } from '@/providers/notification-unread-provider';

interface NotificationBellProps {
  href: string;
  role?: RbacRole;
  className?: string;
}

export function NotificationBell({ href, className }: NotificationBellProps) {
  const { unreadCount } = useNotificationUnread();

  return (
    <Link
      href={href}
      className={cn(
        'relative inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-primary',
        className,
      )}
      aria-label={
        unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
      }
    >
      <Bell className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      {unreadCount > 0 && (
        <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive/100 px-1 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
