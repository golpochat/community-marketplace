'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import type { Payment, Payout, SellerEarningsSummary, SellerPlatformFeeInfo, StripeConnectAccount } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { LoadingState } from '@/components/LoadingState';
import { monetizationService } from '@/services/monetization.service';
import { paymentsService } from '@/services/payments.service';

function SellerEarningsContent() {
  const searchParams = useSearchParams();
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectSetupError, setConnectSetupError] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  const [openingDashboard, setOpeningDashboard] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [platformFee, setPlatformFee] = useState<SellerPlatformFeeInfo | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, payoutResponse, connectData, feeInfo, paymentsResponse, pending] =
        await Promise.all([
        paymentsService.getEarningsSummary(),
        paymentsService.getPayoutHistory(),
        paymentsService.getConnectStatus(),
        monetizationService.getSellerPlatformFee().catch(() => null),
        paymentsService.getSellerPayments(1, 10).catch(() => ({ data: [] as Payment[] })),
        paymentsService.getPendingTransfers().catch(() => []),
      ]);
      setSummary(summaryData);
      setPayouts(payoutResponse.data ?? []);
      setSellerPayments(paymentsResponse.data ?? []);
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
      setMessage('Welcome back from Stripe. We refreshed your Connect status below.');
    }
  }, [searchParams]);

  async function handleOnboard() {
    setOnboarding(true);
    setError(null);
    setConnectSetupError(null);
    setMessage(null);
    try {
      const returnUrl = `${window.location.origin}/seller/earnings?connect=return`;
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

  const needsStripeConnectSetup = Boolean(connectSetupError);

  const isReady = Boolean(
    connect?.onboardingComplete && connect.chargesEnabled && connect.payoutsEnabled,
  );

  return (
    <>
      <PageHeader
        title="Earnings"
        description="Connect your bank account and track payouts from sales."
      />

      {message && (
        <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {message}
        </p>
      )}
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
            <p className="mb-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
              Irish sellers onboard with Stripe Express. Buyers cannot pay for your listings until
              charges and payouts are enabled. In test mode, use Stripe&apos;s test business details.
            </p>
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
              {!isReady && (
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
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Refresh status
              </button>
            </div>
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

          <DashboardCard title="Payment history">
            {sellerPayments.length === 0 ? (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No payments yet.</p>
            ) : (
              <ul className="space-y-2">
                {sellerPayments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
                  >
                    <span>{formatCurrency(payment.amount, payment.currency)}</span>
                    <span className="capitalize text-[hsl(var(--dashboard-sidebar-muted))]">
                      {payment.status}
                    </span>
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
