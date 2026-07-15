'use client';

import { useCallback } from 'react';

import { useAppFeedback } from '@community-marketplace/ui';

export type AdminToastTone = 'success' | 'error' | 'info';

/** @deprecated Use `useAppFeedback()` from `@community-marketplace/ui`. */
export function useAdminToast() {
  const { success, error, info, dismiss } = useAppFeedback();

  const push = useCallback(
    (message: string, tone: AdminToastTone = 'info') => {
      if (tone === 'success') success(message);
      else if (tone === 'error') error(message);
      else info(message);
    },
    [success, error, info],
  );

  return { push, dismiss, toasts: [] as never[] };
}

/** @deprecated Toasts render via global `ToastProvider`. */
export function AdminToastStack({
  toasts: _toasts,
  onDismiss: _onDismiss,
}: {
  toasts: unknown[];
  onDismiss: (id: string) => void;
}) {
  return null;
}
