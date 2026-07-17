'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import type { Payment, Payout, PlatformPurchase, SellerEarningsSummary, SellerPlatformFeeInfo, StripeConnectAccount } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { useAppFeedback } from '@community-marketplace/ui';
import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { LoadingState } from '@/components/LoadingState';
import { SellerStripeVerificationGate } from '@/components/seller/seller-stripe-verification-gate';
import { isSellerVerified } from '@community-marketplace/types';
import type { SellerVerificationStatus } from '@community-marketplace/types';
import { monetizationService } from '@/services/monetization.service';
import type { StatementExportFormat } from '@/services/monetization.service';
import { paymentsService } from '@/services/payments.service';
import { sellerVerificationService } from '@/services/seller-verification.service';
import { StatementExportButtons } from '@/components/dashboard/statement-export-buttons';
import { StripeConnectOnboardingPanel } from '@/components/seller/stripe-connect-onboarding-panel';
import { stripeConnectReturnUrl } from '@/lib/stripe-connect-urls';

const PLATFORM_PURCHASE_LABELS: Record<PlatformPurchase['type'], string> = {
  listing_boost: 'Listing boost',
  featured_slot: 'Featured listing',
  fast_track_verification: 'Fast-track verification',
  store_slot_2: 'Store slot',
  store_slot_3: 'Store slot',
  store_bundle_3: 'Store slot bundle',
  buyer_statement: 'Purchase statement',
  seller_growth_pack: 'Seller Growth Pack',
  ai_credit_2: 'AI Credits (€2)',
  ai_credit_5: 'AI Credits (€5)',
  ai_credit_10: 'AI Credits (€10)',
  featured_store: 'Featured storefront',
};

function currentStatementDefaults() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function SellerEarningsContent() {
  const searchParams = useSearchParams();
  const feedback = useAppFeedback();
  const [summary, setSummary] = useState<SellerEarningsSummary | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [sellerPayments, setSellerPayments] = useState<Payment[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<
    Array<{
      paymentId: string;
      listingId: string;
      netAmount: number;
      currency: string;
      createdAt: string;
    }>
  >([]);
  const [connect, setConnect] = useState<StripeConnectAccount | null>(null);
  const [verification, setVerification] = useState<SellerVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectSetupError, setConnectSetupError] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  const [openingDashboard, setOpeningDashboard] = useState(false);
  const [platformFee, setPlatformFee] = useState<SellerPlatformFeeInfo | null>(null);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);
  const [platformPurchases, setPlatformPurchases] = useState<PlatformPurchase[]>([]);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [statementPeriod, setStatementPeriod] = useState(currentStatementDefaults);
  const [downloadingStatement, setDownloadingStatement] = useState<StatementExportFormat | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const verificationData = await sellerVerificationService.getStatus();
      setVerification(verificationData);
      const sellerVerified = isSellerVerified(verificationData.sellerStatus);

      const [summaryData, payoutResponse, connectData, feeInfo, paymentsResponse, pending, purchasesResponse] =
        await Promise.all([
        paymentsService.getEarningsSummary(),
        paymentsService.getPayoutHistory(),
        sellerVerified ? paymentsService.getConnectStatus() : Promise.resolve(null),
        monetizationService.getSellerPlatformFee().catch(() => null),
        paymentsService.getSellerPayments(1, 10).catch(() => ({ data: [] as Payment[] })),
        paymentsService.getPendingTransfers().catch(() => []),
        monetizationService.getSellerPurchases(1, 10).catch(() => ({ data: [] as PlatformPurchase[] })),
      ]);
      setSummary(summaryData);
      setPayouts(payoutResponse.data ?? []);
      setSellerPayments(paymentsResponse.data ?? []);
      setPlatformPurchases(purchasesResponse.data ?? []);
      setPendingTransfers(pending);
      setConnect(connectData);
      setPlatformFee(feeInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get('connect') === 'return') {
      feedback.info(
        'Welcome back from Stripe',
        'We refreshed your Connect status below.',
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- show once per return navigation
  }, [searchParams]);

  async function handleOnboard() {
    if (!isSellerVerified(verification?.sellerStatus)) return;

    setOnboarding(true);
    setError(null);
    setConnectSetupError(null);
    try {
      const returnUrl = stripeConnectReturnUrl();
      const account = await paymentsService.startConnectOnboarding(returnUrl, returnUrl);
      if (account.onboardingUrl) {
        window.location.href = account.onboardingUrl;
        return;
      }
      setConnect(account);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start onboarding';
      if (message.includes('signed up for Connect') || message.includes('dashboard.stripe.com')) {
        setConnectSetupError(message);
      } else {
        setError(message);
      }
    } finally {
      setOnboarding(false);
    }
  }

  async function handleOpenDashboard() {
    if (!isSellerVerified(verification?.sellerStatus)) return;

    setOpeningDashboard(true);
    setError(null);
    try {
      const { url } = await paymentsService.getConnectDashboardLink();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open Stripe dashboard');
    } finally {
      setOpeningDashboard(false);
    }
  }

  async function handleDownloadInvoice(purchase: PlatformPurchase) {
    setDownloadingInvoiceId(purchase.id);
    setError(null);
    try {
      await monetizationService.downloadSellerInvoice(purchase.id, purchase.receiptNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download invoice');
    } finally {
      setDownloadingInvoiceId(null);
    }
  }

  async function handleDownloadStatement(format: StatementExportFormat) {
    setDownloadingStatement(format);
    setError(null);
    try {
      await monetizationService.downloadSellerStatement(statementPeriod.year, statementPeriod.month, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download statement');
    } finally {
      setDownloadingStatement(null);
    }
  }

  async function handleDownloadReceipt(payment: Payment) {
    setDownloadingReceiptId(payment.id);
    setError(null);
    try {
      await paymentsService.downloadSellerReceipt(payment.id, payment.receiptNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download sales record');
    } finally {
      setDownloadingReceiptId(null);
    }
  }

  const needsStripeConnectSetup = Boolean(connectSetupError);

  const sellerVerified = isSellerVerified(verification?.sellerStatus);

  const isReady = Boolean(
    sellerVerified &&
      connect?.onboardingComplete &&
      connect.chargesEnabled &&
      connect.payoutsEnabled,
  );

  return (
    <>
      <PageHeader
        title="Earnings"
        description={
          sellerVerified
            ? 'Connect your bank account and track payouts from sales.'
            : 'Track earnings and complete seller verification before setting up payouts.'
        }
      />

      {error && !needsStripeConnectSetup && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}
      {loading && (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading...</p>
      )}

      {!loading && (
        <div className="space-y-6">
          {platformFee && (
            <DashboardCard title="Platform fee">
              <p className="text-sm text-[hsl(var(--dashboard-main-fg))]">
                Your platform fee:{' '}
                <strong>{platformFee.effectiveFeePercent}%</strong>
                {platformFee.isVerifiedRate
                  ? ' (verified seller rate)'
                  : platformFee.isCustomOverride
                    ? ' (custom override)'
                    : ' (default)'}
              </p>
              <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                Cashback for buyers is funded by the platform, not deducted from your payout.
              </p>
            </DashboardCard>
          )}
          <DashboardCard title="Stripe Connect (required to get paid)">
            {!sellerVerified ? (
              <SellerStripeVerificationGate />
            ) : (
              <>
            {!isReady && !needsStripeConnectSetup && (
              <div className="mb-4">
                <StripeConnectOnboardingPanel
                  connectStarted={Boolean(connect)}
                  onboarding={onboarding}
                  onContinue={() => void handleOnboard()}
                />
              </div>
            )}
            {needsStripeConnectSetup && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <p className="font-medium">Stripe Connect is not enabled on your platform account yet.</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>
                    Open{' '}
                    <a
                      href="https://dashboard.stripe.com/test/connect"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[hsl(var(--dashboard-accent))] underline"
                    >
                      Stripe Connect (test mode)
                    </a>{' '}
                    and complete the platform setup.
                  </li>
                  <li>Return here and click <strong>Connect with Stripe</strong> again.</li>
                </ol>
                <p className="mt-3 text-xs text-amber-900/80">
                  For local-only testing without Stripe, leave <code className="rounded bg-amber-100 px-1">STRIPE_SECRET_KEY</code> empty in{' '}
                  <code className="rounded bg-amber-100 px-1">apps/api/.env</code> and restart the API.
                </p>
              </div>
            )}
            {error && !needsStripeConnectSetup && (
              <p className="mb-4 text-sm text-red-600">{error}</p>
            )}
            {connect ? (
              <div className="space-y-1 text-sm text-[hsl(var(--dashboard-main-fg))]">
                <p>Charges enabled: {connect.chargesEnabled ? 'Yes' : 'No'}</p>
                <p>Payouts enabled: {connect.payoutsEnabled ? 'Yes' : 'No'}</p>
                <p>Onboarding complete: {connect.onboardingComplete ? 'Yes' : 'No'}</p>
                {isReady && (
                  <p className="font-medium text-green-700">Your account is ready to receive payments.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                Not connected to Stripe yet.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {!isReady && needsStripeConnectSetup && (
                <button
                  type="button"
                  onClick={() => void handleOnboard()}
                  disabled={onboarding}
                  className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {onboarding ? 'Redirecting…' : connect ? 'Continue Stripe onboarding' : 'Connect with Stripe'}
                </button>
              )}
              {isReady && (
                <button
                  type="button"
                  onClick={() => void handleOpenDashboard()}
                  disabled={openingDashboard}
                  className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {openingDashboard ? 'Opening…' : 'Open Stripe Express dashboard'}
                </button>
              )}
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] px-4 py-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] transition-colors duration-150 hover:bg-[hsl(var(--dashboard-sidebar-active)/0.5)]"
              >
                Refresh status
              </button>
            </div>
              </>
            )}
          </DashboardCard>

          {summary && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Total earnings', value: formatCurrency(summary.totalEarnings, summary.currency) },
                { label: 'Pending payouts', value: formatCurrency(summary.pendingPayouts, summary.currency) },
                { label: 'Completed payouts', value: formatCurrency(summary.completedPayouts, summary.currency) },
                { label: 'Payments', value: String(summary.paymentCount) },
              ].map((stat) => (
                <DashboardCard key={stat.label}>
                  <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{stat.label}</p>
                  <p className="mt-1 text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]">
                    {stat.value}
                  </p>
                </DashboardCard>
              ))}
            </div>
          )}

          <DashboardCard title="Payout history">
            {payouts.length === 0 ? (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No payouts yet.</p>
            ) : (
              <ul className="space-y-2">
                {payouts.map((payout) => (
                  <li
                    key={payout.id}
                    className="flex items-center justify-between rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))]"
                  >
                    <span>{formatCurrency(payout.amount, payout.currency)}</span>
                    <span className="capitalize text-[hsl(var(--dashboard-sidebar-muted))]">
                      {payout.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>

          {pendingTransfers.length > 0 && (
            <DashboardCard title="Upcoming transfers (separate charge mode)">
              <ul className="space-y-2">
                {pendingTransfers.map((transfer) => (
                  <li
                    key={transfer.paymentId}
                    className="flex items-center justify-between rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
                  >
                    <span>{formatCurrency(transfer.netAmount, transfer.currency)}</span>
                    <span className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                      Awaiting settlement
                    </span>
                  </li>
                ))}
              </ul>
            </DashboardCard>
          )}

          <DashboardCard title="Monthly statement">
            <p className="mb-3 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Free summary of your sales and platform spend for a calendar month. Download as PDF, CSV, or Excel.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="text-sm text-[hsl(var(--dashboard-main-fg))]">
                Month
                <select
                  value={statementPeriod.month}
                  onChange={(e) =>
                    setStatementPeriod((current) => ({ ...current, month: Number(e.target.value) }))
                  }
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
                  onChange={(e) =>
                    setStatementPeriod((current) => ({ ...current, year: Number(e.target.value) }))
                  }
                  className="mt-1 block w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-card px-3 py-2 text-sm"
                />
              </label>
              <StatementExportButtons
                onDownload={handleDownloadStatement}
                downloading={downloadingStatement}
              />
            </div>
          </DashboardCard>

          <DashboardCard title="Platform purchases">
            <p className="mb-3 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Invoices for boosts, featured listings, verification, and store slots. PDF copies are
              emailed automatically after each payment.
            </p>
            {platformPurchases.length === 0 ? (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No platform purchases yet.</p>
            ) : (
              <ul className="space-y-2">
                {platformPurchases
                  .filter((purchase) => purchase.type !== 'buyer_statement')
                  .map((purchase) => (
                  <li
                    key={purchase.id}
                    className="flex flex-col gap-2 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">
                        {PLATFORM_PURCHASE_LABELS[purchase.type]}
                      </p>
                      <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                        {purchase.receiptNumber ? ` · ${purchase.receiptNumber}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{formatCurrency(purchase.amount, purchase.currency)}</span>
                      <button
                        type="button"
                        onClick={() => void handleDownloadInvoice(purchase)}
                        disabled={downloadingInvoiceId === purchase.id}
                        className="rounded-md border border-[hsl(var(--dashboard-sidebar-border))] px-2 py-1 text-xs font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)] disabled:opacity-50"
                      >
                        {downloadingInvoiceId === purchase.id ? 'Downloading…' : 'Invoice'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>

          <DashboardCard title="Payment history">
            {sellerPayments.length === 0 ? (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No payments yet.</p>
            ) : (
              <ul className="space-y-2">
                {sellerPayments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-col gap-2 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>{formatCurrency(payment.amount, payment.currency)}</span>
                    <div className="flex items-center gap-2">
                      <span className="capitalize text-[hsl(var(--dashboard-sidebar-muted))]">
                        {payment.status}
                      </span>
                      {payment.status === 'succeeded' && (
                        <button
                          type="button"
                          onClick={() => void handleDownloadReceipt(payment)}
                          disabled={downloadingReceiptId === payment.id}
                          className="rounded-md border border-[hsl(var(--dashboard-sidebar-border))] px-2 py-1 text-xs font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)] disabled:opacity-50"
                        >
                          {downloadingReceiptId === payment.id ? 'Downloading…' : 'Sales record'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>
        </div>
      )}
    </>
  );
}

export default function SellerEarningsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SellerEarningsContent />
    </Suspense>
  );
}
