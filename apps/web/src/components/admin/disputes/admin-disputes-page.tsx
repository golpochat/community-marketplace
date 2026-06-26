'use client';

import { useCallback, useEffect, useState } from 'react';

import type { MarketplaceDispute, MarketplaceDisputeStatus } from '@community-marketplace/types';
import {
  DISPUTE_REASON_LABELS,
} from '@community-marketplace/types';
import { formatListedAgo } from '@community-marketplace/utils';
import {
  Card,
  IconActionButton,
  IconActionGroup,
  TruncatedText,
} from '@community-marketplace/ui-dashboard';

import { AdminTableFooter } from '@/components/dashboard/admin-table-footer';
import { DashboardPageShell, DataTable } from '@/components/dashboard/async-resource';
import { DocumentPreview } from '@/components/admin/seller-verification/document-preview';
import { DisputeStatusBadge } from '@/components/disputes/dispute-status-badge';
import { DisputeTimeline } from '@/components/disputes/dispute-timeline';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { adminService, type AdminServiceRole } from '@/services/admin.service';

type QueueFilter = MarketplaceDisputeStatus | 'all';

const QUEUE_TABS: { id: QueueFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'awaiting_evidence', label: 'Awaiting evidence' },
  { id: 'under_review', label: 'Under review' },
  { id: 'resolved_buyer_favored', label: 'Buyer favored' },
  { id: 'resolved_seller_favored', label: 'Seller favored' },
  { id: 'closed', label: 'Closed' },
];

export function AdminDisputesPage({ role }: { role: AdminServiceRole }) {
  const [queue, setQueue] = useState<QueueFilter>('open');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MarketplaceDispute | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDisputes = useCallback(
    (page: number, limit: number) =>
      adminService.listDisputes(role, {
        page,
        limit,
        status: queue === 'all' ? undefined : queue,
      }),
    [role, queue],
  );

  const { page, setPage, data, meta, loading, error, totalPages, reload } = usePaginatedQuery({
    fetcher: fetchDisputes,
  });

  const loadDetail = useCallback(
    async (disputeId: string) => {
      setDetailLoading(true);
      setActionError(null);
      try {
        const result = await adminService.getDispute(role, disputeId);
        setDetail(result);
        setResolutionNotes(result.resolutionNotes ?? '');
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to load dispute');
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [role],
  );

  useEffect(() => {
    if (selectedId) {
      void loadDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId, loadDetail]);

  async function runAction(action: () => Promise<MarketplaceDispute>) {
    setActing(true);
    setActionError(null);
    try {
      const updated = await action();
      setDetail(updated);
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActing(false);
    }
  }

  const rows = data.map((dispute: MarketplaceDispute) => [
    <TruncatedText key={`title-${dispute.id}`} text={dispute.listing?.title ?? dispute.listingId} />,
    dispute.buyer?.displayName ?? dispute.buyerId.slice(0, 8),
    dispute.seller?.displayName ?? dispute.sellerId.slice(0, 8),
    DISPUTE_REASON_LABELS[dispute.reason],
    <DisputeStatusBadge key={`status-${dispute.id}`} status={dispute.disputeStatus} />,
    formatListedAgo(dispute.createdAt),
    <IconActionGroup key={`actions-${dispute.id}`}>
      <IconActionButton
        icon="eye"
        label="Review"
        onClick={() => setSelectedId(dispute.id)}
      />
    </IconActionGroup>,
  ]);

  const isResolved =
    detail &&
    (detail.disputeStatus === 'resolved_buyer_favored' ||
      detail.disputeStatus === 'resolved_seller_favored' ||
      detail.disputeStatus === 'closed');

  return (
    <DashboardPageShell
      title="Dispute queue"
      description="Review evidence and resolve buyer–seller disputes."
      loading={loading}
      error={error}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {QUEUE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setQueue(tab.id);
              setPage(1);
              setSelectedId(null);
            }}
            className={`rounded-full px-3 py-1 text-sm ${
              queue === tab.id
                ? 'bg-[hsl(var(--dashboard-accent))] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Queue">
          {!loading && rows.length === 0 ? (
            <p className="text-sm text-gray-500">No disputes in this queue.</p>
          ) : (
            <DataTable
              columns={['Listing', 'Buyer', 'Seller', 'Reason', 'Status', 'Opened', '']}
              rows={rows}
            />
          )}
          <AdminTableFooter
            page={page}
            totalPages={totalPages}
            total={meta?.total ?? 0}
            onPageChange={setPage}
          />
        </Card>

        <Card title={detail ? 'Decision panel' : 'Select a dispute'}>
          {!selectedId ? (
            <p className="text-sm text-gray-500">Select a dispute from the queue to review evidence.</p>
          ) : detailLoading ? (
            <p className="text-sm text-gray-500">Loading dispute…</p>
          ) : detail ? (
            <div className="space-y-4">
              {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
              <div className="flex flex-wrap items-center gap-2">
                <DisputeStatusBadge status={detail.disputeStatus} />
                <span className="text-sm text-gray-600">
                  {DISPUTE_REASON_LABELS[detail.reason]}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-gray-800">{detail.description}</p>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-900">Evidence</p>
                {(detail.evidence ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">No evidence uploaded yet.</p>
                ) : (
                  (detail.evidence ?? []).map((item) => (
                    <DocumentPreview
                      key={item.id}
                      label={item.description ?? `${item.uploaderRole} evidence`}
                      url={item.fileUrl}
                    />
                  ))
                )}
              </div>

              <DisputeTimeline events={detail.timeline ?? []} />

              {!isResolved ? (
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={3}
                    placeholder="Resolution notes (required to resolve)…"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={acting}
                      onClick={() =>
                        void runAction(() =>
                          adminService.requestDisputeEvidence(role, detail.id),
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Request evidence
                    </button>
                    <button
                      type="button"
                      disabled={acting}
                      onClick={() =>
                        void runAction(() => adminService.markDisputeUnderReview(role, detail.id))
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Mark under review
                    </button>
                    <button
                      type="button"
                      disabled={acting || resolutionNotes.trim().length < 1}
                      onClick={() =>
                        void runAction(() =>
                          adminService.resolveDispute(role, detail.id, {
                            outcome: 'resolved_buyer_favored',
                            resolutionNotes: resolutionNotes.trim(),
                          }),
                        )
                      }
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Favor buyer
                    </button>
                    <button
                      type="button"
                      disabled={acting || resolutionNotes.trim().length < 1}
                      onClick={() =>
                        void runAction(() =>
                          adminService.resolveDispute(role, detail.id, {
                            outcome: 'resolved_seller_favored',
                            resolutionNotes: resolutionNotes.trim(),
                          }),
                        )
                      }
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Favor seller
                    </button>
                    <button
                      type="button"
                      disabled={acting || resolutionNotes.trim().length < 1}
                      onClick={() =>
                        void runAction(() =>
                          adminService.resolveDispute(role, detail.id, {
                            outcome: 'closed',
                            resolutionNotes: resolutionNotes.trim(),
                          }),
                        )
                      }
                      className="rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Resolved {detail.resolvedAt ? formatListedAgo(detail.resolvedAt) : ''}.
                  {detail.resolutionNotes ? ` ${detail.resolutionNotes}` : ''}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-red-600">Could not load dispute.</p>
          )}
        </Card>
      </div>
    </DashboardPageShell>
  );
}
