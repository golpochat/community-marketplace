import type { ListingStatus } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';

const STATUS_CONFIG: Record<
  ListingStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  draft: {
    label: 'Draft',
    dotClass: 'bg-gray-400',
    textClass: 'text-gray-700',
  },
  pending_review: {
    label: 'Pending review',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-800',
  },
  active: {
    label: 'Live',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-800',
  },
  paused: {
    label: 'Paused',
    dotClass: 'bg-sky-500',
    textClass: 'text-sky-800',
  },
  expired: {
    label: 'Expired',
    dotClass: 'bg-orange-500',
    textClass: 'text-orange-800',
  },
  sold: {
    label: 'Sold',
    dotClass: 'bg-gray-400',
    textClass: 'text-gray-700',
  },
  ended: {
    label: 'Ended',
    dotClass: 'bg-gray-400',
    textClass: 'text-gray-600',
  },
  removed: {
    label: 'Removed',
    dotClass: 'bg-red-500',
    textClass: 'text-red-700',
  },
  rejected: {
    label: 'Rejected',
    dotClass: 'bg-red-400',
    textClass: 'text-red-700',
  },
};

export interface ListingStatusBadgeProps {
  status: ListingStatus;
  className?: string;
}

export function ListingStatusBadge({ status, className }: ListingStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium',
        config.textClass,
        className,
      )}
    >
      <span className={cn('h-2 w-2 shrink-0 rounded-full', config.dotClass)} aria-hidden />
      {config.label}
    </span>
  );
}

export function formatExpiresIn(expiresAt?: string): string | null {
  if (!expiresAt) return null;
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Expired';
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires in 1 day';
  return `Expires in ${days} days`;
}

export function formatExpiredAgo(expiresAt?: string): string | null {
  if (!expiresAt) return null;
  const days = Math.ceil((Date.now() - new Date(expiresAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Expired today';
  if (days === 1) return 'Expired 1 day ago';
  return `Expired ${days} days ago`;
}
