'use client';

import { useCallback, useEffect, useState } from 'react';

import type { DeliveryChangeLog, PaginatedResult } from '@community-marketplace/types';
import type { ApiResponse } from '@community-marketplace/types';
import { Card, IconActionButton, IconActionGroup, TruncatedText } from '@community-marketplace/ui-dashboard';
import { formatCurrency } from '@community-marketplace/utils';

import { DashboardPageShell } from '@/components/dashboard/async-resource';
import { deliveryService } from '@/services/delivery.service';
import { normalizePaginated } from '@/lib/normalize-api-response';

interface AdminDeliveryReviewsPageProps {
  role: 'SUPER_ADMIN' | 'ADMIN';
}

function formatOptionList(items: DeliveryChangeLog['changes']['after']) {
  if (!items?.length) return '—';
  return items
    .map((item) => `${item.label}${item.price != null ? ` (${formatCurrency(item.price, 'EUR')})` : ''}`)
    .join(', ');
}

export function AdminDeliveryReviewsPage({ role }: AdminDeliveryReviewsPageProps) {
  const [reviews, setReviews] = useState<DeliveryChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = (await deliveryService.listPendingReviews(role)) as ApiResponse<
        PaginatedResult<DeliveryChangeLog> | DeliveryChangeLog[]
      >;
      const result = normalizePaginated<DeliveryChangeLog>(response, { page: 1, limit: 20 });
      setReviews(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load delivery reviews');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDecision(id: string, decision: 'approve' | 'reject') {
    setActionId(id);
    setError(null);
    try {
      const reviewNotes = notes[id]?.trim() || undefined;
      if (decision === 'approve') {
        await deliveryService.approveReview(role, id, reviewNotes);
      } else {
        await deliveryService.rejectReview(role, id, reviewNotes);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionId(null);
    }
  }

  return (
    <DashboardPageShell
      title="Delivery Reviews"
      description="Review pending delivery option changes on live listings."
      loading={loading}
      error={error}
      empty={!loading && !error && reviews.length === 0}
      emptyTitle="No pending delivery reviews"
      emptyDescription="When sellers update delivery on active listings, flagged changes appear here."
    >
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-[hsl(var(--dashboard-main-fg))]">
                  <TruncatedText text={review.listing?.title ?? review.listingId} />
                </p>
                <p className="text-[hsl(var(--dashboard-sidebar-muted))]">
                  Seller: {review.seller?.displayName ?? review.seller?.email ?? review.sellerId}
                </p>
                <p className="text-[hsl(var(--dashboard-sidebar-muted))]">
                  Submitted: {new Date(review.createdAt).toLocaleString()}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-[hsl(var(--dashboard-sidebar-active)/0.35)] p-3">
                    <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">Current (live)</p>
                    <p className="mt-1 text-[hsl(var(--dashboard-main-fg))]">
                      {formatOptionList(review.changes.before)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[hsl(var(--dashboard-sidebar-active)/0.35)] p-3">
                    <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">Proposed</p>
                    <p className="mt-1 text-[hsl(var(--dashboard-main-fg))]">
                      {formatOptionList(review.changes.after)}
                    </p>
                  </div>
                </div>
                {review.changes.reviewReasons && review.changes.reviewReasons.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="font-medium text-amber-900">Flagged reasons</p>
                    <ul className="mt-1 list-inside list-disc text-sm text-amber-800">
                      {review.changes.reviewReasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <textarea
                  value={notes[review.id] ?? ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [review.id]: e.target.value }))}
                  placeholder="Optional notes to seller…"
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
                />
              </div>
              <IconActionGroup className="shrink-0 flex-col sm:flex-row lg:flex-col">
                <IconActionButton
                  icon="check"
                  label="Approve delivery changes"
                  variant="accent"
                  disabled={actionId === review.id}
                  onClick={() => void handleDecision(review.id, 'approve')}
                />
                <IconActionButton
                  icon="x"
                  label="Reject delivery changes"
                  variant="danger"
                  disabled={actionId === review.id}
                  onClick={() => void handleDecision(review.id, 'reject')}
                />
              </IconActionGroup>
            </div>
          </Card>
        ))}
      </div>
    </DashboardPageShell>
  );
}
