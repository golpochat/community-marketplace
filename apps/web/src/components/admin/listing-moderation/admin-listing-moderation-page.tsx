'use client';

import { useCallback, useState } from 'react';

import type { Listing, ListingStatus } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { useAppFeedback } from '@community-marketplace/ui';
import {
  Card,
  IconActionButton,
  IconActionGroup,
  ListingStatusBadge,
  TruncatedText,
} from '@community-marketplace/ui-dashboard';

import { AdminListingReviewDialog } from '@/components/dashboard/admin-listing-review-dialog';
import { AdminTableFooter } from '@/components/dashboard/admin-table-footer';
import { DashboardSectionTabs } from '@/components/dashboard/dashboard-section-tabs';
import { DashboardPageShell, DataTable } from '@/components/dashboard/async-resource';
import { DashboardTableBody } from '@/components/dashboard/dashboard-filtered-empty-state';
import { ReasonPromptDialog } from '@/components/shared/reason-prompt-dialog';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { ListingMediaImage } from '@/components/listings/listing-media-image';
import { adminService, type AdminServiceRole } from '@/services/admin.service';

type ModerationQueue = 'pending' | 'flagged' | 'rejected' | 'removed';

type ListingPrompt =
  | { listingId: string; kind: 'reject' }
  | { listingId: string; kind: 'remove' }
  | { listingId: string; kind: 'investigate' };

const QUEUE_TABS: { id: ModerationQueue; label: string; status: ListingStatus }[] = [
  { id: 'pending', label: 'Pending Listings', status: 'pending_review' },
  { id: 'flagged', label: 'Flagged Listings', status: 'flagged' },
  { id: 'rejected', label: 'Rejected Listings', status: 'rejected' },
  { id: 'removed', label: 'Removed Listings', status: 'removed' },
];

function ListingThumb({ listing }: { listing: Listing }) {
  const cover = listing.images[0];

  return (
    <div className="h-12 w-12 overflow-hidden">
      <ListingMediaImage
        image={cover}
        variant="tiny"
        alt={listing.title}
        rounded="md"
        className="h-12 w-12"
      />
    </div>
  );
}

export function AdminListingModerationPage({ role }: { role: AdminServiceRole }) {
  const feedback = useAppFeedback();
  const [queue, setQueue] = useState<ModerationQueue>('pending');
  const [actingId, setActingId] = useState<string | null>(null);
  const [reviewListingId, setReviewListingId] = useState<string | null>(null);
  const [listingPrompt, setListingPrompt] = useState<ListingPrompt | null>(null);

  const activeTab = QUEUE_TABS.find((tab) => tab.id === queue)!;

  const fetchListings = useCallback(
    (page: number, limit: number) =>
      adminService.listListingModerationQueue(role, activeTab.id, { page, limit }),
    [role, activeTab.id],
  );

  const { page, setPage, data, meta, loading, error, totalPages, reload } = usePaginatedQuery({
    fetcher: fetchListings,
  });

  async function handleApprove(listingId: string) {
    setActingId(listingId);
    try {
      await adminService.approveListingModeration(role, listingId);
      feedback.success('Listing approved', 'The listing is now live.');
      await reload();
      if (reviewListingId === listingId) setReviewListingId(null);
    } catch (err) {
      feedback.error(
        'Failed to approve listing',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setActingId(null);
    }
  }

  async function handleListingPromptConfirm(value: string) {
    if (!listingPrompt) return;
    const { listingId, kind } = listingPrompt;
    setActingId(listingId);
    try {
      if (kind === 'reject') {
        await adminService.rejectListingModeration(role, listingId, value);
        feedback.success('Listing rejected', 'The seller has been notified.');
      } else if (kind === 'remove') {
        await adminService.removeListingModeration(role, listingId, value);
        feedback.success('Listing removed', 'The listing is no longer visible.');
      } else {
        await adminService.investigateListing(role, listingId, value || undefined);
        feedback.success('Marked for investigation', 'Listing flagged for review.');
      }
      setListingPrompt(null);
      await reload();
    } catch (err) {
      feedback.error(
        kind === 'reject'
          ? 'Failed to reject listing'
          : kind === 'remove'
            ? 'Failed to remove listing'
            : 'Failed to mark for investigation',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setActingId(null);
    }
  }

  const rows = data.map((listing) => {
    const isActing = actingId === listing.id;
    const reason =
      listing.moderationNotes ??
      listing.rejectionReason ??
      listing.removalReason ??
      '—';

    return [
      <ListingThumb key={`thumb-${listing.id}`} listing={listing} />,
      <TruncatedText key={`title-${listing.id}`} text={listing.title} />,
      listing.seller?.displayName ?? listing.sellerId.slice(0, 8),
      formatCurrency(listing.price, listing.currency),
      <ListingStatusBadge key={`status-${listing.id}`} status={listing.status} />,
      <TruncatedText key={`reason-${listing.id}`} text={reason} />,
      <div key={`actions-${listing.id}`} className="flex flex-wrap gap-2">
        <IconActionGroup>
          <IconActionButton
            icon="eye"
            label="View"
            onClick={() => setReviewListingId(listing.id)}
          />
          {(queue === 'pending' || queue === 'flagged') && (
            <>
              <IconActionButton
                icon="check"
                label={isActing ? 'Working…' : 'Approve'}
                variant="accent"
                disabled={isActing}
                onClick={() => void handleApprove(listing.id)}
              />
              <IconActionButton
                icon="alert-triangle"
                label="Investigate"
                disabled={isActing}
                onClick={() => setListingPrompt({ listingId: listing.id, kind: 'investigate' })}
              />
              <IconActionButton
                icon="x"
                label="Reject"
                variant="danger"
                disabled={isActing}
                onClick={() => setListingPrompt({ listingId: listing.id, kind: 'reject' })}
              />
            </>
          )}
          {queue !== 'removed' && (
            <IconActionButton
              icon="trash"
              label="Remove"
              variant="danger"
              disabled={isActing}
              onClick={() => setListingPrompt({ listingId: listing.id, kind: 'remove' })}
            />
          )}
        </IconActionGroup>
      </div>,
    ];
  });

  return (
    <>
      <DashboardPageShell
        title="Listing Moderation"
        description="Review pending, flagged, rejected, and removed listings."
        loading={loading}
        error={error}
        empty={!loading && !error && rows.length === 0}
        emptyPreserveFilters
        emptyTitle={`No ${activeTab.label.toLowerCase()}`}
      >
        <DashboardSectionTabs
          items={QUEUE_TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
          activeId={queue}
          onChange={(id) => {
            setQueue(id as ModerationQueue);
            setPage(1);
          }}
        />
        <Card>
          <DashboardTableBody
            isEmpty={rows.length === 0}
            emptyTitle={`No ${activeTab.label.toLowerCase()}`}
            emptyDescription="Switch to another queue tab above to continue reviewing."
          >
            <DataTable
              columns={['', 'Title', 'Seller', 'Price', 'Status', 'Reason', 'Actions']}
              rows={rows}
            />
            <AdminTableFooter
              page={page}
              totalPages={totalPages}
              total={meta.total}
              onPageChange={setPage}
            />
          </DashboardTableBody>
        </Card>
      </DashboardPageShell>

      <ReasonPromptDialog
        open={listingPrompt?.kind === 'reject'}
        elevated
        title="Reject listing"
        description="Provide a reason the seller will see."
        label="Rejection reason"
        placeholder="Explain why this listing was rejected…"
        confirmLabel="Reject listing"
        variant="destructive"
        required
        loading={actingId === listingPrompt?.listingId}
        onConfirm={(value) => void handleListingPromptConfirm(value)}
        onClose={() => {
          if (actingId === null) setListingPrompt(null);
        }}
      />

      <ReasonPromptDialog
        open={listingPrompt?.kind === 'remove'}
        elevated
        title="Remove listing"
        description="Provide a reason the seller will see."
        label="Removal reason"
        placeholder="Explain why this listing was removed…"
        confirmLabel="Remove listing"
        variant="destructive"
        required
        loading={actingId === listingPrompt?.listingId}
        onConfirm={(value) => void handleListingPromptConfirm(value)}
        onClose={() => {
          if (actingId === null) setListingPrompt(null);
        }}
      />

      <ReasonPromptDialog
        open={listingPrompt?.kind === 'investigate'}
        elevated
        title="Mark for investigation"
        description="Add optional notes for the moderation team."
        label="Investigation notes"
        placeholder="Describe what needs further review…"
        confirmLabel="Mark for investigation"
        required={false}
        loading={actingId === listingPrompt?.listingId}
        onConfirm={(value) => void handleListingPromptConfirm(value)}
        onClose={() => {
          if (actingId === null) setListingPrompt(null);
        }}
      />

      {reviewListingId && (
        <AdminListingReviewDialog
          open={reviewListingId != null}
          role={role}
          listingId={reviewListingId}
          onClose={() => setReviewListingId(null)}
          onApproved={() => {
            setReviewListingId(null);
            void reload();
          }}
        />
      )}
    </>
  );
}
