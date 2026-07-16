'use client';

import Link from 'next/link';
import { useCallback } from 'react';

import type { MarketplaceDispute } from '@community-marketplace/types';
import { DISPUTE_REASON_LABELS } from '@community-marketplace/types';
import { formatListedAgo } from '@community-marketplace/utils';
import { Card, TruncatedText } from '@community-marketplace/ui-dashboard';

import { DashboardPageShell, DataTable } from '@/components/dashboard/async-resource';
import { DashboardTableBody } from '@/components/dashboard/dashboard-filtered-empty-state';
import { DisputeStatusBadge } from '@/components/disputes/dispute-status-badge';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { disputesService } from '@/services/disputes.service';

export function BuyerDisputesPage() {
  const fetchDisputes = useCallback(
    (page: number, limit: number) => disputesService.listMine({ page, limit }),
    [],
  );

  const { page, setPage, data, meta, loading, error, totalPages } = usePaginatedQuery({
    fetcher: fetchDisputes,
  });

  const rows = data.map((dispute: MarketplaceDispute) => [
    <TruncatedText key={`title-${dispute.id}`} text={dispute.listing?.title ?? dispute.listingId} />,
    DISPUTE_REASON_LABELS[dispute.reason],
    <DisputeStatusBadge key={`status-${dispute.id}`} status={dispute.disputeStatus} />,
    formatListedAgo(dispute.createdAt),
    <Link
      key={`link-${dispute.id}`}
      href={`/buyer/disputes/${dispute.id}`}
      className="text-sm font-medium text-blue-600 hover:underline"
    >
      View
    </Link>,
  ]);

  return (
    <DashboardPageShell
      title="My disputes"
      description="Track transaction disputes you have opened."
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      emptyPreserveFilters
      emptyTitle="You have not opened any disputes yet"
      emptyDescription="Disputes appear here after you open one from a purchase."
    >
      <Card title="Dispute list">
        <DashboardTableBody
          isEmpty={rows.length === 0}
          emptyTitle="You have not opened any disputes yet"
          emptyDescription="Disputes appear here after you open one from a purchase."
        >
        <DataTable
          columns={['Listing', 'Reason', 'Status', 'Opened', '']}
          rows={rows}
        />
        {totalPages > 1 ? (
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-2 py-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
              Page {page} of {totalPages} ({meta?.total ?? 0} total)
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}
        </DashboardTableBody>
      </Card>
    </DashboardPageShell>
  );
}
