'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import type { BuyerStatementIntentResponse, BuyerStatementStatusResponse, ListingSummary, Payment, PaymentIntentResponse, PendingReviewItem, CashbackEstimate } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { StripeCheckoutPanel } from '@/components/payments/stripe-checkout-form';
import { BoostCheckoutPanel } from '@/components/payments/boost-checkout-panel';
import { Pagination } from '@/components/shared/pagination';
import { ReviewPromptDialog } from '@/components/trust/review-prompt-dialog';
import { listingsService } from '@/services/listings.service';
import { buyerService } from '@/services/marketplace.service';
import { monetizationService } from '@/services/monetization.service';
import type { StatementExportFormat } from '@/services/monetization.service';
import { paymentsService } from '@/services/payments.service';
import { trustService } from '@/services/trust.service';
import { LoadingState } from '@/components/LoadingState';
import { StatementExportButtons } from '@/components/dashboard/statement-export-buttons';

interface PayableListing {
  id: string;
  label: string;
}

const HISTORY_PAGE_SIZE = 10;

function currentStatementDefaults() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

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
  return (
    <Suspense fallback={<LoadingState />}>
      <BuyerPurchasesContent />
    </Suspense>
  );
}

function BuyerPurchasesContent() {
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [payableListings, setPayableListings] = useState<PayableListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState('');
  const [intent, setIntent] = useState<PaymentIntentResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingReviewItem[]>([]);
  const [dismissedReviewIds, setDismissedReviewIds] = useState<Set<string>>(new Set());
  const [cashbackEstimate, setCashbackEstimate] = useState<CashbackEstimate | null>(null);
  const [statementPeriod, setStatementPeriod] = useState(currentStatementDefaults);
  const [statementStatus, setStatementStatus] = useState<BuyerStatementStatusResponse | null>(null);
  const [statementIntent, setStatementIntent] = useState<BuyerStatementIntentResponse | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [downloadingStatement, setDownloadingStatement] = useState<StatementExportFormat | null>(null);

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

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setCheckoutMessage('Payment successful. Your purchase will appear in history shortly.');
      void loadHistory();
    } else if (searchParams.get('checkout') === 'cancelled') {
      setCheckoutMessage('Checkout was cancelled. You can try again when ready.');
    }
  }, [searchParams, loadHistory]);

  useEffect(() => {
    if (!selectedListingId) {
      setCashbackEstimate(null);
      return;
    }
    void monetizationService
      .estimateCashback(selectedListingId)
      .then(setCashbackEstimate)
      .catch(() => setCashbackEstimate(null));
  }, [selectedListingId]);

  const loadStatementStatus = useCallback(async () => {
    setStatementLoading(true);
    try {
      const status = await monetizationService.getBuyerStatementStatus(
        statementPeriod.year,
        statementPeriod.month,
      );
      setStatementStatus(status);
    } catch {
      setStatementStatus(null);
    } finally {
      setStatementLoading(false);
    }
  }, [statementPeriod.month, statementPeriod.year]);

  useEffect(() => {
    void loadStatementStatus();
  }, [loadStatementStatus]);

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

  async function handleDownloadReceipt(payment: Payment) {
    setDownloadingReceiptId(payment.id);
    setError(null);
    try {
      await paymentsService.downloadBuyerReceipt(payment.id, payment.receiptNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download receipt');
    } finally {
      setDownloadingReceiptId(null);
    }
  }

  async function handleUnlockStatement() {
    setStatementLoading(true);
    setError(null);
    try {
      const response = await monetizationService.createBuyerStatementIntent(
        statementPeriod.year,
        statementPeriod.month,
      );
      setStatementIntent(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start statement unlock');
    } finally {
      setStatementLoading(false);
    }
  }

  async function handleDownloadStatement(format: StatementExportFormat) {
    setDownloadingStatement(format);
    setError(null);
    try {
      await monetizationService.downloadBuyerStatement(statementPeriod.year, statementPeriod.month, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download statement');
    } finally {
      setDownloadingStatement(null);
    }
  }

  async function handleStatementPaymentSuccess() {
    setStatementIntent(null);
    await loadStatementStatus();
    setCheckoutMessage('Statement unlocked. You can download it below in PDF, CSV, or Excel.');
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

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      {checkoutMessage && (
        <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {checkoutMessage}
        </p>
      )}

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
            Choose a listing from your favorites or the marketplace. Pay by card to earn SellNearby
            Credit — card details are handled by Stripe Elements, never stored on our servers.
          </p>
          {cashbackEstimate?.eligible && (
            <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
              You will earn {formatCurrency(cashbackEstimate.amount, 'EUR')} credit. Unlocks on{' '}
              {new Date(cashbackEstimate.unlockAt).toLocaleDateString()}.
            </p>
          )}
          <form onSubmit={handleCreateIntent} className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedListingId}
              onChange={(e) => setSelectedListingId(e.target.value)}
              className="flex-1 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-card px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))] focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]"
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
            <p className="mt-3 text-sm text-[hsl(var(--dashboard-main-fg))]">
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

        <DashboardCard title="Purchase statement">
          <p className="mb-3 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Download a monthly PDF summary of your marketplace purchases. Unlock once per month
            {statementStatus ? ` for ${formatCurrency(statementStatus.price, statementStatus.currency)}` : ''}.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="text-sm text-[hsl(var(--dashboard-main-fg))]">
              Month
              <select
                value={statementPeriod.month}
                onChange={(e) => {
                  setStatementIntent(null);
                  setStatementPeriod((current) => ({ ...current, month: Number(e.target.value) }));
                }}
                className="mt-1 block w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-card px-3 py-2 text-sm"
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                  <option key={month} value={month}>
                    {new Date(2000, month - 1, 1).toLocaleString('en-IE', { month: 'long' })}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-[hsl(var(--dashboard-main-fg))]">
              Year
              <input
                type="number"
                min={2020}
                max={new Date().getFullYear()}
                value={statementPeriod.year}
                onChange={(e) => {
                  setStatementIntent(null);
                  setStatementPeriod((current) => ({ ...current, year: Number(e.target.value) }));
                }}
                className="mt-1 block w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-card px-3 py-2 text-sm"
              />
            </label>
            {statementStatus?.unlocked ? (
              <StatementExportButtons
                onDownload={handleDownloadStatement}
                downloading={downloadingStatement}
              />
            ) : (
              <button
                type="button"
                onClick={() => void handleUnlockStatement()}
                disabled={statementLoading || Boolean(statementIntent)}
                className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {statementLoading
                  ? 'Checking…'
                  : statementStatus
                    ? `Unlock for ${formatCurrency(statementStatus.price, statementStatus.currency)}`
                    : 'Unlock statement'}
              </button>
            )}
          </div>
          {statementIntent && (
            <div className="mt-4 border-t border-[hsl(var(--dashboard-sidebar-border))] pt-4">
              <BoostCheckoutPanel
                intent={statementIntent}
                onSuccess={() => void handleStatementPaymentSuccess()}
                confirmPurchase={monetizationService.confirmBuyerStatement}
                confirmLabel="Pay and unlock statement"
              />
            </div>
          )}
        </DashboardCard>

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
                className="flex flex-col gap-2 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-card px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-[hsl(var(--dashboard-main-fg))]">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <p className="text-xs text-[hsl(var(--dashboard-main-fg))]">Listing: {payment.listingId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-fit rounded-full bg-[hsl(var(--dashboard-sidebar-active)/0.5)] px-2 py-0.5 text-xs capitalize text-[hsl(var(--dashboard-main-fg))]">
                    {payment.status}
                  </span>
                  {payment.status === 'succeeded' && (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleDownloadReceipt(payment)}
                        disabled={downloadingReceiptId === payment.id}
                        className="rounded-md border border-[hsl(var(--dashboard-sidebar-border))] px-2 py-1 text-xs font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)] disabled:opacity-50"
                      >
                        {downloadingReceiptId === payment.id ? 'Downloading…' : 'Receipt'}
                      </button>
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
                        className="rounded-md border border-[hsl(var(--dashboard-sidebar-border))] px-2 py-1 text-xs font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)] disabled:opacity-50"
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
