'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ApiResponse, PaginatedResult, TitleChangeLog } from '@community-marketplace/types';
import { Card, IconActionButton, IconActionGroup, TruncatedText } from '@community-marketplace/ui-dashboard';

import { DashboardPageShell } from '@/components/dashboard/async-resource';
import { normalizePaginated } from '@/lib/normalize-api-response';
import { titleAmendService } from '@/services/title-amend.service';

interface AdminTitleReviewsPageProps {
  role: 'SUPER_ADMIN' | 'ADMIN';
}

export function AdminTitleReviewsPage({ role }: AdminTitleReviewsPageProps) {
  const [reviews, setReviews] = useState<TitleChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = (await titleAmendService.listPendingReviews(role)) as ApiResponse<
        PaginatedResult<TitleChangeLog> | TitleChangeLog[]
      >;
      const result = normalizePaginated<TitleChangeLog>(response, { page: 1, limit: 20 });
      setReviews(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load title reviews');
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
        await titleAmendService.approveReview(role, id, reviewNotes);
      } else {
        await titleAmendService.rejectReview(role, id, reviewNotes);
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
      title="Title Reviews"
      description="Review title amendments on previously approved listings. Buyers still see the live title until you approve."
      loading={loading}
      error={error}
      empty={!loading && !error && reviews.length === 0}
      emptyTitle="No pending title reviews"
      emptyDescription="When sellers amend titles on live listings, amendments appear here."
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
                <p className="text-[hsl(var(--dashboard-sidebar-muted))]">
                  Similarity: {Math.round(review.similarityScore * 100)}%
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-[hsl(var(--dashboard-sidebar-active)/0.35)] p-3">
                    <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">
                      Live (buyers see)
                    </p>
                    <p className="mt-1 text-[hsl(var(--dashboard-main-fg))]">{review.oldTitle}</p>
                  </div>
                  <div className="rounded-lg bg-[hsl(var(--dashboard-sidebar-active)/0.35)] p-3">
                    <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">Proposed</p>
                    <p className="mt-1 text-[hsl(var(--dashboard-main-fg))]">{review.newTitle}</p>
                  </div>
                </div>
                <textarea
                  value={notes[review.id] ?? ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [review.id]: e.target.value }))}
                  rows={2}
                  placeholder="Optional review notes"
                  className="mt-2 w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] px-3 py-2 text-sm"
                />
              </div>
              <IconActionGroup className="shrink-0 flex-col sm:flex-row lg:flex-col">
                <IconActionButton
                  icon="check"
                  label="Approve title amendment"
                  variant="accent"
                  disabled={actionId === review.id}
                  onClick={() => void handleDecision(review.id, 'approve')}
                />
                <IconActionButton
                  icon="x"
                  label="Reject title amendment"
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
