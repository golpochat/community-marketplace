'use client';

import type { SellerStatus } from '@community-marketplace/types';

const STATUS_STYLES: Record<SellerStatus, { label: string; className: string }> = {
  unverified: {
    label: 'Unverified',
    className: 'bg-yellow-100 text-yellow-900 ring-yellow-200',
  },
  verification_required: {
    label: 'Verification required',
    className: 'bg-orange-100 text-orange-900 ring-orange-200',
  },
  verified: {
    label: 'Verified',
    className: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-red-100 text-red-900 ring-red-200',
  },
  under_review: {
    label: 'Under review',
    className: 'bg-sky-100 text-sky-900 ring-sky-200',
  },
};

export function SellerProfileStatusBadge({
  status,
  className,
}: {
  status: SellerStatus;
  className?: string;
}) {
  const config = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${config.className} ${className ?? ''}`}
    >
      {config.label}
    </span>
  );
}
