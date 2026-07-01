'use client';

import type { MarketplaceDisputeStatus } from '@community-marketplace/types';
import { DISPUTE_STATUS_LABELS } from '@community-marketplace/types';

const STATUS_STYLES: Record<MarketplaceDisputeStatus, string> = {
  open: 'bg-amber-100 text-amber-900',
  awaiting_evidence: 'bg-orange-100 text-orange-900',
  under_review: 'bg-blue-100 text-blue-900',
  resolved_buyer_favored: 'bg-emerald-100 text-emerald-900',
  resolved_seller_favored: 'bg-emerald-100 text-emerald-900',
  closed: 'bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-[hsl(var(--dashboard-main-fg))]',
};

export function DisputeStatusBadge({ status }: { status: MarketplaceDisputeStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {DISPUTE_STATUS_LABELS[status]}
    </span>
  );
}
