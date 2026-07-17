'use client';

import { useCallback, useEffect, useState } from 'react';

import type { MarketplaceDispute, MarketplaceDisputeStatus } from '@community-marketplace/types';
import { DISPUTE_REASON_LABELS } from '@community-marketplace/types';
import { formatCurrency, formatListedAgo } from '@community-marketplace/utils';
import {
  Button,
  IconActionButton,
  IconActionGroup,
  TruncatedText,
} from '@community-marketplace/ui-dashboard';

import { DisputeResolveDialog } from '@/components/admin/disputes/dispute-resolve-dialog';
import { DocumentPreview } from '@/components/admin/seller-verification/document-preview';
import { AdminTableFooter } from '@/components/dashboard/admin-table-footer';
import { AdminQueueDetailLayout } from '@/components/dashboard/admin-queue-detail-layout';
import { DashboardSectionTabs } from '@/components/dashboard/dashboard-section-tabs';
import { DashboardPageShell, DataTable } from '@/components/dashboard/async-resource';
import { StatCard } from '@/components/dashboard/stat-card';
import { DisputeStatusBadge } from '@/components/disputes/dispute-status-badge';
import { DisputeTimeline } from '@/components/disputes/dispute-timeline';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { adminService, type AdminServiceRole } from '@/services/admin.service';

type WorkQueue = 'open' | 'awaiting_evidence' | 'under_review' | 'all';
type ResolvedQueue = 'resolved_buyer_favored' | 'resolved_seller_favored' | 'closed';
type QueueFilter = WorkQueue | ResolvedQueue;

const WORK_TABS: { id: WorkQueue; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'awaiting_evidence', label: 'Awaiting evidence' },
  { id: 'under_review', label: 'Under review' },
  { id: 'all', label: 'All' },
];

const RESOLVED_TABS: { id: ResolvedQueue; label: string }[] = [
  { id: 'resolved_buyer_favored', label: 'Buyer favored' },
  { id: 'resolved_seller_favored', label: 'Seller favored' },
  { id: 'closed', label: 'Closed' },
];

const RESOLVED_STATUSES = new Set<MarketplaceDisputeStatus>([
  'resolved_buyer_favored',
  'resolved_seller_favored',
  'closed',
]);

const EMPTY_BY_QUEUE: Record<QueueFilter, { title: string; description: string }> = {
  all: {
    title: 'No disputes',
    description: 'There are no disputes in this view.',
  },
  open: {
    title: 'No open disputes',
    description: 'No disputes are waiting for an initial review.',
  },
  awaiting_evidence: {
    title: 'No disputes awaiting evidence',
    description: 'No cases are waiting on buyer or seller uploads.',
  },
  under_review: {
    title: 'No disputes under review',
    description: 'Nothing is actively being investigated right now.',
  },
  resolved_buyer_favored: {
    title: 'No buyer-favored outcomes',
    description: 'No disputes resolved in favor of buyers in this view.',
  },
  resolved_seller_favored: {
    title: 'No seller-favored outcomes',
    description: 'No disputes resolved in favor of sellers in this view.',
  },
  closed: {
    title: 'No closed disputes',
    description: 'No closed disputes match this filter.',
  },
};

type ResolveOutcome = ResolvedQueue;

function isResolvedQueue(queue: QueueFilter): queue is ResolvedQueue {
  return RESOLVED_STATUSES.has(queue as MarketplaceDisputeStatus);
}

function isResolvedDispute(dispute: MarketplaceDispute): boolean {
  return RESOLVED_STATUSES.has(dispute.disputeStatus);
}

function formatPartyName(name: string | undefined, id: string): string {
  if (name?.trim()) return name.trim();
  return `User ${id.slice(0, 8)}`;
}

function listingLabel(dispute: MarketplaceDispute): string {
  return dispute.listing?.title ?? `Listing ${dispute.listingId.slice(0, 8)}`;
}

export function AdminDisputesPage({ role }: { role: AdminServiceRole }) {
  const [queue, setQueue] = useState<QueueFilter>('open');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MarketplaceDispute | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [resolveOutcome, setResolveOutcome] = useState<ResolveOutcome | null>(null);
  const [needsActionTotal, setNeedsActionTotal] = useState(0);
  const [awaitingEvidenceTotal, setAwaitingEvidenceTotal] = useState(0);

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

  const refreshDisputeStats = useCallback(async () => {
    const [openResult, underReviewResult, awaitingResult] = await Promise.all([
      adminService.listDisputes(role, { page: 1, limit: 1, status: 'open' }),
      adminService.listDisputes(role, { page: 1, limit: 1, status: 'under_review' }),
      adminService.listDisputes(role, { page: 1, limit: 1, status: 'awaiting_evidence' }),
    ]);
    setNeedsActionTotal((openResult.meta?.total ?? 0) + (underReviewResult.meta?.total ?? 0));
    setAwaitingEvidenceTotal(awaitingResult.meta?.total ?? 0);
  }, [role]);

  useEffect(() => {
    void refreshDisputeStats();
  }, [refreshDisputeStats]);

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

  function handleWorkQueueChange(nextQueue: string) {
    setQueue(nextQueue as WorkQueue);
    setPage(1);
    setSelectedId(null);
    setDetail(null);
    setActionError(null);
  }

  function handleResolvedQueueChange(nextQueue: string) {
    setQueue(nextQueue as ResolvedQueue);
    setPage(1);
    setSelectedId(null);
    setDetail(null);
    setActionError(null);
  }

  async function runAction(action: () => Promise<MarketplaceDispute>) {
    setActing(true);
    setActionError(null);
    try {
      const updated = await action();
      setDetail(updated);
      await reload();
      await refreshDisputeStats();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActing(false);
    }
  }

  async function handleConfirmResolve(notes: string) {
    if (!detail || !resolveOutcome) return;
    setResolutionNotes(notes);
    setActing(true);
    setActionError(null);
    try {
      const updated = await adminService.resolveDispute(role, detail.id, {
        outcome: resolveOutcome,
        resolutionNotes: notes,
      });
      setDetail(updated);
      setResolveOutcome(null);
      await reload();
      await refreshDisputeStats();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActing(false);
    }
  }

  const rows = data.map((dispute: MarketplaceDispute) => [
    <TruncatedText key={`title-${dispute.id}`} text={listingLabel(dispute)} />,
    formatPartyName(dispute.buyer?.displayName, dispute.buyerId),
    formatPartyName(dispute.seller?.displayName, dispute.sellerId),
    DISPUTE_REASON_LABELS[dispute.reason],
    <DisputeStatusBadge key={`status-${dispute.id}`} status={dispute.disputeStatus} />,
    formatListedAgo(dispute.createdAt),
    <IconActionGroup key={`actions-${dispute.id}`}>
      <IconActionButton icon="eye" label="Review" onClick={() => setSelectedId(dispute.id)} />
    </IconActionGroup>,
  ]);

  const queueTotal = meta?.total ?? 0;
  const emptyCopy = EMPTY_BY_QUEUE[queue];
  const viewingResolved = isResolvedQueue(queue);
  const workTabActiveId = viewingResolved ? '__none__' : queue;

  const detailContent = detail ? (
    <div className="space-y-4">
      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

      <div className="space-y-1">
        <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">{listingLabel(detail)}</p>
        {detail.listing ? (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            {formatCurrency(detail.listing.price, detail.listing.currency)}
          </p>
        ) : null}
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          {formatPartyName(detail.buyer?.displayName, detail.buyerId)} vs{' '}
          {formatPartyName(detail.seller?.displayName, detail.sellerId)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DisputeStatusBadge status={detail.disputeStatus} />
        <span className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          Opened {formatListedAgo(detail.createdAt)}
        </span>
      </div>

      <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.2)] px-3 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
          {DISPUTE_REASON_LABELS[detail.reason]}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-[hsl(var(--dashboard-main-fg))]">
          {detail.description}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">Evidence</p>
        {(detail.evidence ?? []).length === 0 ? (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No evidence uploaded yet.</p>
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

      {isResolvedDispute(detail) ? (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          Resolved {detail.resolvedAt ? formatListedAgo(detail.resolvedAt) : ''}.
          {detail.resolutionNotes ? ` ${detail.resolutionNotes}` : ''}
        </p>
      ) : (
        <div className="space-y-3 border-t border-[hsl(var(--dashboard-sidebar-border))] pt-4">
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            rows={3}
            placeholder="Draft resolution notes before resolving…"
            className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {detail.disputeStatus !== 'awaiting_evidence' ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={acting}
                onClick={() => void runAction(() => adminService.requestDisputeEvidence(role, detail.id))}
              >
                Request evidence
              </Button>
            ) : null}
            {detail.disputeStatus !== 'under_review' ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={acting}
                onClick={() => void runAction(() => adminService.markDisputeUnderReview(role, detail.id))}
              >
                Mark under review
              </Button>
            ) : null}
            <Button
              variant="default"
              size="sm"
              disabled={acting || resolutionNotes.trim().length < 1}
              onClick={() => setResolveOutcome('resolved_buyer_favored')}
            >
              Favor buyer
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={acting || resolutionNotes.trim().length < 1}
              onClick={() => setResolveOutcome('resolved_seller_favored')}
            >
              Favor seller
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={acting || resolutionNotes.trim().length < 1}
              onClick={() => setResolveOutcome('closed')}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  ) : selectedId && !detailLoading ? (
    <p className="text-sm text-destructive">Could not load dispute.</p>
  ) : null;

  return (
    <DashboardPageShell
      title="Dispute queue"
      description="Review evidence and resolve buyer–seller disputes."
      loading={loading}
      error={error}
    >
      <AdminQueueDetailLayout
        tabs={WORK_TABS}
        activeTabId={workTabActiveId}
        onTabChange={handleWorkQueueChange}
        summary={
          <>
            <StatCard label="In this filter" value={String(queueTotal)} />
            <StatCard label="Needs action" value={String(needsActionTotal)} />
            <StatCard label="Awaiting evidence" value={String(awaitingEvidenceTotal)} />
          </>
        }
        queueLoading={loading}
        queueTotal={queueTotal}
        queueEmptyTitle={emptyCopy.title}
        queueEmptyDescription={emptyCopy.description}
        queueToolbar={
          <DashboardSectionTabs
            items={RESOLVED_TABS}
            activeId={viewingResolved ? queue : '__none__'}
            onChange={handleResolvedQueueChange}
            variant="nested"
          />
        }
        queueContent={
          <DataTable
            columns={['Listing', 'Buyer', 'Seller', 'Reason', 'Status', 'Opened', '']}
            rows={rows}
          />
        }
        queueFooter={
          <AdminTableFooter
            page={page}
            totalPages={totalPages}
            total={queueTotal}
            onPageChange={setPage}
          />
        }
        showDetailPanel={queueTotal > 0}
        detailTitle={detail ? 'Decision panel' : 'Dispute review'}
        detailEmptyMessage="Select a dispute from the queue to review evidence."
        detailLoading={detailLoading}
        detailContent={detailContent}
      />

      <DisputeResolveDialog
        open={resolveOutcome !== null}
        outcome={resolveOutcome}
        loading={acting}
        initialNotes={resolutionNotes}
        onClose={() => setResolveOutcome(null)}
        onConfirm={(notes) => void handleConfirmResolve(notes)}
      />
    </DashboardPageShell>
  );
}
