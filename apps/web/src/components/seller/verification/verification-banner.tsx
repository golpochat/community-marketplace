'use client';

import Link from 'next/link';

export type VerificationBannerType = 'info' | 'warning' | 'critical';

const BANNER_STYLES: Record<VerificationBannerType, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-950',
  warning: 'border-amber-300 bg-amber-50 text-amber-950',
  critical: 'border-red-300 bg-red-50 text-red-950',
};

export interface VerificationBannerProps {
  type?: VerificationBannerType;
  message: string;
  className?: string;
  actionHref?: string;
  actionLabel?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  children?: React.ReactNode;
}

export function VerificationBanner({
  type = 'info',
  message,
  className,
  actionHref,
  actionLabel,
  dismissible = false,
  onDismiss,
  children,
}: VerificationBannerProps) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${BANNER_STYLES[type]} ${className ?? ''}`}
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium">{message}</p>
        {dismissible && onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 text-xs font-medium opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        ) : null}
      </div>
      {children}
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-2 inline-block font-medium underline hover:no-underline"
        >
          {actionLabel} →
        </Link>
      ) : null}
    </div>
  );
}
