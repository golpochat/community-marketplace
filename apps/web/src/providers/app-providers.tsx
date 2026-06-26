'use client';

import type { ReactNode } from 'react';

import { NotificationUnreadProvider } from '@/providers/notification-unread-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return <NotificationUnreadProvider>{children}</NotificationUnreadProvider>;
}
