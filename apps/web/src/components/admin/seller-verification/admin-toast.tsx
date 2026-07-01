'use client';

import { useCallback } from 'react';

import { useToast } from '@community-marketplace/ui';

export type AdminToastTone = 'success' | 'error' | 'info';

/** @deprecated Prefer `useToast()` from `@community-marketplace/ui` directly. */
export function useAdminToast() {
  const { toast, dismiss } = useToast();

  const push = useCallback(
    (message: string, tone: AdminToastTone = 'info') => {
      toast({
        title: message,
        variant: tone === 'success' ? 'success' : tone === 'error' ? 'error' : 'default',
      });
    },
    [toast],
  );

  return { push, dismiss, toasts: [] as never[] };
}

/** @deprecated Toasts render via global `ToastProvider` — this component is a no-op. */
export function AdminToastStack({
  toasts: _toasts,
  onDismiss: _onDismiss,
}: {
  toasts: unknown[];
  onDismiss: (id: string) => void;
}) {
  return null;
}
