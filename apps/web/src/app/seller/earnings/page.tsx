'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Payout, SellerEarningsSummary, StripeConnectAccount } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { paymentsService } from '@/services/payments.service';

export default function SellerEarningsPage() {
  const [summary, setSummary] = useState<SellerEarningsSummary | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [connect, setConnect] = useState<StripeConnectAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, payoutResponse, connectData] = await Promise.all([
        paymentsService.getEarningsSummary(),
        paymentsService.getPayoutHistory(),
        paymentsService.getConnectStatus(),
      ]);
      setSummary(summaryData);
      setPayouts(payoutResponse.data ?? []);
      setConnect(connectData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleOnboard() {
    setOnboarding(true);
    setError(null);
    try {
      const account = await paymentsService.startConnectOnboarding(
        `${window.location.origin}/seller/earnings`,
        `${window.location.origin}/seller/earnings`,
      );
      if (account.onboardingUrl) {
        window.location.href = account.onboardingUrl;
        return;
      }
      setConnect(account);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start onboarding');
    } finally {
      setOnboarding(false);
    }
  }

  return (
    <>
      <PageHeader title="Earnings" description="Payouts and Stripe Connect status." />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading && (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading...</p>
      )}

      {!loading && (
        <div className="space-y-6">
          <DashboardCard title="Stripe Connect">
            {connect ? (
              <div className="space-y-1 text-sm text-[hsl(var(--dashboard-main-fg))]">
                <p>Charges enabled: {connect.chargesEnabled ? 'Yes' : 'No'}</p>
                <p>Payouts enabled: {connect.payoutsEnabled ? 'Yes' : 'No'}</p>
                <p>Onboarding complete: {connect.onboardingComplete ? 'Yes' : 'No'}</p>
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                Not connected to Stripe yet.
              </p>
            )}
            {(!connect || !connect.onboardingComplete) && (
              <button
                type="button"
                onClick={() => void handleOnboard()}
                disabled={onboarding}
                className="mt-4 rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {onboarding ? 'Redirecting...' : 'Complete Stripe onboarding'}
              </button>
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
        </div>
      )}
    </>
  );
}
