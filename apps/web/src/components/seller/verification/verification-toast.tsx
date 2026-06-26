'use client';

import { useCallback, useState } from 'react';

import type { VerificationBannerType } from './verification-banner';

export interface VerificationToast {
  id: number;
  message: string;
  type: VerificationBannerType;
}

let toastId = 0;

export function useVerificationToast() {
  const [toasts, setToasts] = useState<VerificationToast[]>([]);

  const push = useCallback((message: string, type: VerificationBannerType = 'info') => {
    const id = ++toastId;
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 6000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, push, dismiss };
}

const TOAST_STYLES: Record<VerificationBannerType, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-950',
  warning: 'border-amber-300 bg-amber-50 text-amber-950',
  critical: 'border-red-300 bg-red-50 text-red-950',
};

export function VerificationToastStack({
  toasts,
  onDismiss,
}: {
  toasts: VerificationToast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg ${TOAST_STYLES[toast.type]}`}
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-xs font-medium opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
