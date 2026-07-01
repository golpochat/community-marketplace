'use client';

import type { SellerStatus } from '@community-marketplace/types';

const STATUS_STYLES: Record<
  SellerStatus | 'pending' | 'approved' | 'rejected',
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-900 ring-amber-200',
  },
  under_review: {
    label: 'Under review',
    className: 'bg-sky-100 text-sky-900 ring-sky-200',
  },
  verified: {
    label: 'Verified',
    className: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  },
  unverified: {
    label: 'Unverified',
    className: 'bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-[hsl(var(--dashboard-main-fg))] ring-[hsl(var(--dashboard-sidebar-border))]',
  },
  verification_required: {
    label: 'Verification required',
    className: 'bg-orange-100 text-orange-900 ring-orange-200',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-900 ring-red-200',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-rose-200 text-rose-950 ring-rose-300',
  },
};

export function SellerStatusBadge({
  status,
  className,
}: {
  status: SellerStatus | 'pending' | 'approved' | 'rejected';
  className?: string;
}) {
  const config = STATUS_STYLES[status] ?? STATUS_STYLES.unverified;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${config.className} ${className ?? ''}`}
    >
      {config.label}
    </span>
  );
}
