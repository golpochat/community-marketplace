'use client';

import { useCallback, useState } from 'react';

import type { Listing, ListingStatus } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import {
  Card,
  IconActionButton,
  IconActionGroup,
  ListingStatusBadge,
  TruncatedText,
} from '@community-marketplace/ui-dashboard';

import { AdminListingReviewDialog } from '@/components/dashboard/admin-listing-review-dialog';
import { AdminTableFooter } from '@/components/dashboard/admin-table-footer';
import { DashboardPageShell, DataTable } from '@/components/dashboard/async-resource';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { listingImageVariantUrl } from '@/lib/listing-image-url';
import { adminService, type AdminServiceRole } from '@/services/admin.service';

type ModerationQueue = 'pending' | 'flagged' | 'rejected' | 'removed';

const QUEUE_TABS: { id: ModerationQueue; label: string; status: ListingStatus }[] = [
  { id: 'pending', label: 'Pending Listings', status: 'pending_review' },
  { id: 'flagged', label: 'Flagged Listings', status: 'flagged' },
  { id: 'rejected', label: 'Rejected Listings', status: 'rejected' },
  { id: 'removed', label: 'Removed Listings', status: 'removed' },
];

function ListingThumb({ listing }: { listing: Listing }) {
  const cover = listing.images[0];
  const src = cover ? listingImageVariantUrl(cover.url, 'tiny') : undefined;

  if (!src) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-[10px] text-[hsl(var(--dashboard-sidebar-muted))]">
        —
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-12 w-12 rounded-md object-cover" />
  );
}

export function AdminListingModerationPage({ role }: { role: AdminServiceRole }) {
  const [queue, setQueue] = useState<ModerationQueue>('pending');
  const [actingId, setActingId] = useState<string | null>(null);
  const [reviewListingId, setReviewListingId] = useState<string | null>(null);

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
      await reload();
      if (reviewListingId === listingId) setReviewListingId(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to approve listing');
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(listingId: string) {
    const reason = window.prompt('Rejection reason for the seller:');
    if (!reason?.trim()) return;
    setActingId(listingId);
    try {
      await adminService.rejectListingModeration(role, listingId, reason.trim());
      await reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to reject listing');
    } finally {
      setActingId(null);
    }
  }

  async function handleRemove(listingId: string) {
    const reason = window.prompt('Removal reason for the seller:');
    if (!reason?.trim()) return;
    setActingId(listingId);
    try {
      await adminService.removeListingModeration(role, listingId, reason.trim());
      await reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to remove listing');
    } finally {
      setActingId(null);
    }
  }

  async function handleInvestigate(listingId: string) {
    const reason = window.prompt('Investigation notes (optional):') ?? undefined;
    setActingId(listingId);
    try {
      await adminService.investigateListing(role, listingId, reason?.trim() || undefined);
      await reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to mark for investigation');
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
                onClick={() => void handleInvestigate(listing.id)}
              />
              <IconActionButton
                icon="x"
                label="Reject"
                variant="danger"
                disabled={isActing}
                onClick={() => void handleReject(listing.id)}
              />
            </>
          )}
          {queue !== 'removed' && (
            <IconActionButton
              icon="trash"
              label="Remove"
              variant="danger"
              disabled={isActing}
              onClick={() => void handleRemove(listing.id)}
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
        emptyTitle={`No ${activeTab.label.toLowerCase()}`}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {QUEUE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setQueue(tab.id);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                queue === tab.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.7)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Card>
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
        </Card>
      </DashboardPageShell>

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
