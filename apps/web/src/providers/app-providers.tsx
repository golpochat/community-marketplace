'use client';

import type { ReactNode } from 'react';

import { ToastProvider } from '@community-marketplace/ui';

import { NotificationUnreadProvider } from '@/providers/notification-unread-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthIdleTimeout } from '@/components/auth/auth-idle-timeout';
import { AuthSessionSync } from '@/components/auth/auth-session-sync';
import { CookieBanner } from '@/components/legal/cookie-banner';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthSessionSync />
        <AuthIdleTimeout />
        <NotificationUnreadProvider>
          {children}
          <CookieBanner />
        </NotificationUnreadProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
