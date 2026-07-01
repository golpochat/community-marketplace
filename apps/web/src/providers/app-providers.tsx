'use client';

import type { ReactNode } from 'react';

import { ToastProvider } from '@community-marketplace/ui';

import { NotificationUnreadProvider } from '@/providers/notification-unread-provider';
import { ThemeProvider } from '@/providers/theme-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <NotificationUnreadProvider>{children}</NotificationUnreadProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
