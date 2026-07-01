'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ApiResponse, PaginatedResult, PriceChangeLog } from '@community-marketplace/types';
import { Card, IconActionButton, IconActionGroup, TruncatedText } from '@community-marketplace/ui-dashboard';
import { formatCurrency } from '@community-marketplace/utils';

import { DashboardPageShell } from '@/components/dashboard/async-resource';
import { normalizePaginated } from '@/lib/normalize-api-response';
import { pricingService } from '@/services/pricing.service';

interface AdminPriceReviewsPageProps {
  role: 'SUPER_ADMIN' | 'ADMIN';
}

function formatPrice(value?: number) {
  if (value == null) return '—';
  return formatCurrency(value, 'EUR');
}

export function AdminPriceReviewsPage({ role }: AdminPriceReviewsPageProps) {
  const [reviews, setReviews] = useState<PriceChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = (await pricingService.listPendingReviews(role)) as ApiResponse<
        PaginatedResult<PriceChangeLog> | PriceChangeLog[]
      >;
      const result = normalizePaginated<PriceChangeLog>(response, { page: 1, limit: 20 });
      setReviews(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load price reviews');
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
        await pricingService.approveReview(role, id, reviewNotes);
      } else {
        await pricingService.rejectReview(role, id, reviewNotes);
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
      title="Price Reviews"
      description="Review pending price changes on live listings."
      loading={loading}
      error={error}
      empty={!loading && !error && reviews.length === 0}
      emptyTitle="No pending price reviews"
      emptyDescription="When sellers update prices on active listings, flagged changes appear here."
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
                {review.discountPercent != null && (
                  <p className="font-medium text-emerald-700">{review.discountPercent}% discount</p>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-[hsl(var(--dashboard-sidebar-active)/0.35)] p-3">
                    <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">Current (live)</p>
                    <p className="mt-1 text-[hsl(var(--dashboard-main-fg))]">
                      Sale: {formatPrice(review.oldSalePrice)}
                    </p>
                    {review.oldOriginalPrice != null && (
                      <p className="text-[hsl(var(--dashboard-sidebar-muted))] line-through">
                        Original: {formatPrice(review.oldOriginalPrice)}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg bg-[hsl(var(--dashboard-sidebar-active)/0.35)] p-3">
                    <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">Proposed</p>
                    <p className="mt-1 text-[hsl(var(--dashboard-main-fg))]">
                      Sale: {formatPrice(review.newSalePrice)}
                    </p>
                    {review.newOriginalPrice != null && (
                      <p className="text-[hsl(var(--dashboard-sidebar-muted))] line-through">
                        Original: {formatPrice(review.newOriginalPrice)}
                      </p>
                    )}
                  </div>
                </div>
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
                  label="Approve price changes"
                  variant="accent"
                  disabled={actionId === review.id}
                  onClick={() => void handleDecision(review.id, 'approve')}
                />
                <IconActionButton
                  icon="x"
                  label="Reject price changes"
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
