'use client';

import * as React from 'react';

import { cn } from '../lib/utils';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

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

/** SellNearby teal fallback when no dashboard role is mounted. */
const SITE_FEEDBACK_ACCENT = '175 84% 33%';
const SITE_FEEDBACK_ACCENT_FG = '0 0% 100%';

function readFeedbackAccent(): { accent: string; accentFg: string } {
  if (typeof document === 'undefined') {
    return { accent: SITE_FEEDBACK_ACCENT, accentFg: SITE_FEEDBACK_ACCENT_FG };
  }

  const roleEl = document.querySelector<HTMLElement>('[data-dashboard-role]');
  if (roleEl) {
    const styles = getComputedStyle(roleEl);
    const accent = styles.getPropertyValue('--dashboard-accent').trim();
    const accentFg =
      styles.getPropertyValue('--feedback-accent-foreground').trim() ||
      SITE_FEEDBACK_ACCENT_FG;
    if (accent) return { accent, accentFg };
  }

  const root = getComputedStyle(document.documentElement);
  const fromRoot = root.getPropertyValue('--feedback-accent').trim();
  // Avoid unresolved `var(--primary)` — prefer resolved primary channel if needed.
  if (fromRoot && !fromRoot.includes('var(')) {
    return {
      accent: fromRoot,
      accentFg:
        root.getPropertyValue('--feedback-accent-foreground').trim() ||
        SITE_FEEDBACK_ACCENT_FG,
    };
  }

  const primary = root.getPropertyValue('--primary').trim();
  return {
    accent: primary || SITE_FEEDBACK_ACCENT,
    accentFg: SITE_FEEDBACK_ACCENT_FG,
  };
}

function useFeedbackAccent() {
  // Stable SSR/hydration default — never read `document` during render.
  const [colors, setColors] = React.useState({
    accent: SITE_FEEDBACK_ACCENT,
    accentFg: SITE_FEEDBACK_ACCENT_FG,
  });

  React.useEffect(() => {
    const sync = () => setColors(readFeedbackAccent());
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-dashboard-role', 'data-dashboard-theme', 'class'],
    });

    return () => observer.disconnect();
  }, []);

  return colors;
}

function ToastIcon({
  variant,
  accent,
  accentFg,
}: {
  variant: ToastVariant;
  accent: string;
  accentFg: string;
}) {
  if (variant === 'success') {
    return (
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: `hsl(${accent})`,
          color: `hsl(${accentFg})`,
        }}
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

  if (variant === 'warning') {
    return (
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white"
        aria-hidden
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M8 3.5 13.5 13H2.5L8 3.5Z" strokeLinejoin="round" />
          <path d="M8 7v3" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.75" fill="currentColor" stroke="none" />
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
  const { accent, accentFg } = useFeedbackAccent();

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...message, id }]);
    setTimeout(() => dismiss(id), 5500);
  }, [dismiss]);

  // Keep documentElement in sync so any CSS using --feedback-accent also matches.
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--feedback-accent', accent);
    root.style.setProperty('--feedback-accent-foreground', accentFg);
  }, [accent, accentFg]);

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
                'pointer-events-auto flex min-w-[260px] items-start gap-3 border border-border bg-card p-3.5 text-card-foreground shadow-lg',
                'rounded-[var(--radius)]',
                variant === 'success' && 'border-l-[3px]',
                variant === 'error' && 'border-l-[3px] border-l-destructive',
                variant === 'warning' && 'border-l-[3px] border-l-amber-500',
              )}
              style={
                variant === 'success'
                  ? { borderLeftColor: `hsl(${accent})` }
                  : undefined
              }
            >
              <ToastIcon variant={variant} accent={accent} accentFg={accentFg} />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium leading-snug tracking-tight">{t.title}</p>
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

  const warning = React.useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: 'warning' });
    },
    [toast],
  );

  return { success, error, info, warning, dismiss };
}
