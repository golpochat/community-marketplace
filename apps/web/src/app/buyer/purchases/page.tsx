'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import type { ListingSummary, Payment, PaymentIntentResponse, PendingReviewItem } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { StripeCheckoutPanel } from '@/components/payments/stripe-checkout-form';
import { Pagination } from '@/components/shared/pagination';
import { ReviewPromptDialog } from '@/components/trust/review-prompt-dialog';
import { listingsService } from '@/services/listings.service';
import { buyerService } from '@/services/marketplace.service';
import { paymentsService } from '@/services/payments.service';
import { trustService } from '@/services/trust.service';

interface PayableListing {
  id: string;
  label: string;
}

const HISTORY_PAGE_SIZE = 10;

function formatPaymentError(message: string): string {
  if (message.includes('Stripe Connect') || message.includes('not ready to receive')) {
    return 'The seller has not finished Stripe payout setup yet. Ask them to complete Connect under Seller → Earnings.';
  }
  if (message.includes('not available for purchase')) {
    return 'This listing is no longer available for purchase.';
  }
  return message;
}

export default function BuyerPurchasesPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [payableListings, setPayableListings] = useState<PayableListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState('');
  const [intent, setIntent] = useState<PaymentIntentResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingReviewItem[]>([]);
  const [dismissedReviewIds, setDismissedReviewIds] = useState<Set<string>>(new Set());

  const loadPendingReviews = useCallback(async () => {
    try {
      const pending = await trustService.getPendingBuyerReviews();
      setPendingReviews(pending);
    } catch {
      setPendingReviews([]);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentsService.getBuyerHistory(historyPage, HISTORY_PAGE_SIZE);
      setPayments(response.data ?? []);
      setHistoryTotal(response.meta?.total ?? response.data?.length ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  }, [historyPage]);

  const loadPayableListings = useCallback(async () => {
    try {
      const [favorites, browse] = await Promise.all([
        buyerService.getFavorites(1, 50).catch(() => ({ data: [] as ListingSummary[] })),
        listingsService.getAll(1, 50).catch(() => ({ data: [] as ListingSummary[] })),
      ]);

      const merged = new Map<string, PayableListing>();
      for (const listing of [...favorites.data, ...browse.data]) {
        if (listing.status !== 'active') continue;
        merged.set(listing.id, {
          id: listing.id,
          label: `${listing.title} — ${formatCurrency(listing.price, listing.currency)}`,
        });
      }
      const options = Array.from(merged.values());
      setPayableListings(options);
      setSelectedListingId((current) => current || options[0]?.id || '');
    } catch {
      setPayableListings([]);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    void loadPayableListings();
  }, [loadPayableListings]);

  useEffect(() => {
    void loadPendingReviews();
  }, [loadPendingReviews]);

  const visiblePendingReview = pendingReviews.find(
    (item) => !dismissedReviewIds.has(item.listingId),
  );

  async function handleCreateIntent(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedListingId) return;
    setActionLoading(true);
    setError(null);
    try {
      const result = await paymentsService.createPaymentIntent(selectedListingId);
      setIntent(result);
    } catch (err) {
      setError(formatPaymentError(err instanceof Error ? err.message : 'Failed to create payment'));
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePaymentSuccess() {
    setIntent(null);
    await Promise.all([loadHistory(), loadPendingReviews()]);
  }

  async function handleRefund(payment: Payment) {
    const reason = window.prompt('Reason for refund (optional):') ?? undefined;
    if (reason === null) return;
    setRefundingId(payment.id);
    setError(null);
    try {
      await paymentsService.requestRefund(payment.id, reason || undefined);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request refund');
    } finally {
      setRefundingId(null);
    }
  }

  const historyTotalPages = Math.max(1, Math.ceil(historyTotal / HISTORY_PAGE_SIZE));

  return (
    <>
      <PageHeader title="Purchases" description="Initiate and track your purchases." />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {visiblePendingReview && (
        <div className="mb-6">
          <ReviewPromptDialog
            listingId={visiblePendingReview.listingId}
            sellerName={visiblePendingReview.counterpartyName}
            onSubmitted={() => {
              void loadPendingReviews();
            }}
            onDismiss={() => {
              setDismissedReviewIds((current) => new Set(current).add(visiblePendingReview.listingId));
            }}
          />
        </div>
      )}

      <div className="space-y-6">
        <DashboardCard title="Pay for a listing">
          <p className="mb-4 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Choose a listing from your favorites or the marketplace. Card details are handled by
            Stripe Elements — never stored on our servers.
          </p>
          <form onSubmit={handleCreateIntent} className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedListingId}
              onChange={(e) => setSelectedListingId(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]"
              required
            >
              <option value="" disabled>
                Select a listing…
              </option>
              {payableListings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={actionLoading || !selectedListingId}
              className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {actionLoading ? 'Creating…' : 'Continue to payment'}
            </button>
          </form>
          {payableListings.length === 0 && (
            <p className="mt-3 text-sm text-gray-700">
              No active listings available. Browse listings or save favorites first.
            </p>
          )}
        </DashboardCard>

        {intent && (
          <DashboardCard title="Complete payment">
            <div className="mb-4 space-y-1 text-sm text-[hsl(var(--dashboard-main-fg))]">
              <p>
                Amount:{' '}
                {formatCurrency(intent.payment.amount, intent.payment.currency)}
              </p>
              <p className="capitalize">Status: {intent.payment.status}</p>
            </div>
            <StripeCheckoutPanel intent={intent} onSuccess={() => void handlePaymentSuccess()} />
          </DashboardCard>
        )}

        <DashboardCard title="Purchase history">
          {loading && (
            <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading...</p>
          )}
          {!loading && payments.length === 0 && (
            <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No purchases yet.</p>
          )}
          <ul className="space-y-2">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <p className="text-xs text-gray-700">Listing: {payment.listingId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-fit rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-900">
                    {payment.status}
                  </span>
                  {payment.status === 'succeeded' && (
                    <>
                      <Link
                        href={`/buyer/disputes/create?listingId=${payment.listingId}&paymentId=${payment.id}`}
                        className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
                      >
                        Open dispute
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleRefund(payment)}
                        disabled={refundingId === payment.id}
                        className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {refundingId === payment.id ? 'Requesting…' : 'Request refund'}
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <Pagination
            className="mt-4"
            page={historyPage}
            totalPages={historyTotalPages}
            onPageChange={setHistoryPage}
          />
        </DashboardCard>
      </div>
    </>
  );
}
