'use client';

import type { ReactNode } from 'react';

import { ToastProvider } from '@community-marketplace/ui';

import { NotificationUnreadProvider } from '@/providers/notification-unread-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthSessionSync } from '@/components/auth/auth-session-sync';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthSessionSync />
        <NotificationUnreadProvider>{children}</NotificationUnreadProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
