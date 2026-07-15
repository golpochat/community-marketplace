'use client';

import * as React from 'react';

import { cn } from '../lib/utils';

export type ToastVariant = 'default' | 'success' | 'error';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toasts: ToastMessage[];
  toast: (message: Omit<ToastMessage, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') {
    return (
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
        aria-hidden
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (variant === 'error') {
    return (
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
        aria-hidden
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  return (
    <span
      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
      aria-hidden
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="8" cy="8" r="5.5" />
        <path d="M8 5.5v3.5" strokeLinecap="round" />
        <circle cx="8" cy="11" r="0.75" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { ...message, id }]);
    setTimeout(() => dismiss(id), 5500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-[4.25rem] z-[200] flex max-w-[min(100vw-2rem,22rem)] flex-col gap-2 sm:right-5 sm:top-[4.5rem]"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => {
          const variant = t.variant ?? 'default';
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                'pointer-events-auto flex min-w-[260px] items-start gap-3 rounded-lg border border-border bg-card p-3 text-card-foreground shadow-md',
                variant === 'success' && 'border-l-[3px] border-l-primary',
                variant === 'error' && 'border-l-[3px] border-l-destructive',
              )}
            >
              <ToastIcon variant={variant} />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium leading-snug">{t.title}</p>
                {t.description ? (
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Dismiss"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/** Canonical app-wide success / error / info feedback (fixed viewport toasts). */
export function useAppFeedback() {
  const { toast, dismiss } = useToast();

  const success = React.useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: 'success' });
    },
    [toast],
  );

  const error = React.useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: 'error' });
    },
    [toast],
  );

  const info = React.useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: 'default' });
    },
    [toast],
  );

  return { success, error, info, dismiss };
}
