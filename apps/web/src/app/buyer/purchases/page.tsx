'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Payment, PaymentIntentResponse } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { paymentsService } from '@/services/payments.service';

export default function BuyerPurchasesPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listingId, setListingId] = useState('');
  const [intent, setIntent] = useState<PaymentIntentResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentsService.getBuyerHistory();
      setPayments(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  async function handleCreateIntent(event: React.FormEvent) {
    event.preventDefault();
    if (!listingId.trim()) return;
    setActionLoading(true);
    setError(null);
    try {
      const result = await paymentsService.createPaymentIntent(listingId.trim());
      setIntent(result);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirm() {
    if (!intent?.payment.id) return;
    setActionLoading(true);
    setError(null);
    try {
      await paymentsService.confirmPayment(intent.payment.id);
      setIntent(null);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm payment');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="Purchases" description="Initiate and track your purchases." />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="space-y-6">
        <DashboardCard title="Pay for a listing">
          <p className="mb-4 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Card details are collected via Stripe Elements using the client secret — never stored on
            our servers.
          </p>
          <form onSubmit={handleCreateIntent} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              placeholder="Listing ID"
              className="flex-1 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-white px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))] focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]"
            />
            <button
              type="submit"
              disabled={actionLoading}
              className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Create payment
            </button>
          </form>
        </DashboardCard>

        {intent && (
          <DashboardCard title="Payment intent created">
            <div className="space-y-1 text-sm text-[hsl(var(--dashboard-main-fg))]">
              <p>Status: {intent.payment.status}</p>
              <p className="break-all text-[hsl(var(--dashboard-sidebar-muted))]">
                Client secret: {intent.clientSecret}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={actionLoading}
              className="mt-4 rounded-lg bg-[hsl(var(--dashboard-accent))] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Confirm payment (dev)
            </button>
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
                className="flex flex-col gap-2 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                    Listing: {payment.listingId}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-[hsl(var(--dashboard-sidebar-active))] px-2 py-0.5 text-xs capitalize text-[hsl(var(--dashboard-main-fg))]">
                  {payment.status}
                </span>
              </li>
            ))}
          </ul>
        </DashboardCard>
      </div>
    </>
  );
}
