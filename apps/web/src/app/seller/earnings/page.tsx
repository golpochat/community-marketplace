'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import type { Payout, SellerEarningsSummary, StripeConnectAccount } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';

import { paymentsService } from '@/services/payments.service';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

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
        `${window.location.origin}${WEB_APP_ROUTES.sellerEarnings}`,
        `${window.location.origin}${WEB_APP_ROUTES.sellerEarnings}`,
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Earnings</h1>
          <p className="mt-1 text-sm text-gray-600">Payouts and Stripe Connect status.</p>
        </div>
        <Link href={WEB_APP_ROUTES.sellerDashboard} className="text-sm text-blue-600 hover:underline">
          Dashboard
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      {!loading && (
        <>
          <section className="mb-8 rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-medium text-gray-900">Stripe Connect</h2>
            {connect ? (
              <div className="mt-2 text-sm text-gray-700">
                <p>Charges enabled: {connect.chargesEnabled ? 'Yes' : 'No'}</p>
                <p>Payouts enabled: {connect.payoutsEnabled ? 'Yes' : 'No'}</p>
                <p>Onboarding complete: {connect.onboardingComplete ? 'Yes' : 'No'}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-600">Not connected to Stripe yet.</p>
            )}
            {(!connect || !connect.onboardingComplete) && (
              <button
                type="button"
                onClick={() => void handleOnboard()}
                disabled={onboarding}
                className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {onboarding ? 'Redirecting...' : 'Complete Stripe onboarding'}
              </button>
            )}
          </section>

          {summary && (
            <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Total earnings</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(summary.totalEarnings, summary.currency)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Pending payouts</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(summary.pendingPayouts, summary.currency)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Completed payouts</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(summary.completedPayouts, summary.currency)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Payments</p>
                <p className="text-lg font-semibold text-gray-900">{summary.paymentCount}</p>
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-medium text-gray-900">Payout history</h2>
            {payouts.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No payouts yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {payouts.map((payout) => (
                  <li
                    key={payout.id}
                    className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <span>{formatCurrency(payout.amount, payout.currency)}</span>
                    <span className="capitalize text-gray-600">{payout.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
