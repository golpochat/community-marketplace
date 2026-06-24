'use client';

import { ToastProvider } from '@community-marketplace/ui';

import { ThemeProvider } from './theme-provider';

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
