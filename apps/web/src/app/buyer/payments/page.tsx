'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import type { Payment, PaymentIntentResponse } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';

import { paymentsService } from '@/services/payments.service';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

export default function BuyerPaymentsPage() {
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
      setError(err instanceof Error ? err.message : 'Failed to load payments');
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-600">Initiate and track your purchases.</p>
        </div>
        <Link href={WEB_APP_ROUTES.buyerDashboard} className="text-sm text-blue-600 hover:underline">
          Dashboard
        </Link>
      </div>

      <form onSubmit={handleCreateIntent} className="mb-8 rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-900">Pay for a listing</h2>
        <p className="mt-1 text-xs text-gray-500">
          Card details are collected via Stripe Elements using the client secret — never stored on our servers.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            placeholder="Listing ID"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={actionLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Create payment
          </button>
        </div>
      </form>

      {intent && (
        <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
          <p className="font-medium text-green-900">Payment intent created</p>
          <p className="mt-1 text-green-800">Status: {intent.payment.status}</p>
          <p className="mt-1 break-all text-green-700">Client secret: {intent.clientSecret}</p>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={actionLoading}
            className="mt-3 rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800"
          >
            Confirm payment (dev)
          </button>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <section>
        <h2 className="text-sm font-medium text-gray-900">Payment history</h2>
        {loading && <p className="mt-2 text-sm text-gray-500">Loading...</p>}
        {!loading && payments.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">No payments yet.</p>
        )}
        <ul className="mt-3 space-y-2">
          {payments.map((payment) => (
            <li
              key={payment.id}
              className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {formatCurrency(payment.amount, payment.currency)}
                </p>
                <p className="text-xs text-gray-500">Listing: {payment.listingId}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-700">
                {payment.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
