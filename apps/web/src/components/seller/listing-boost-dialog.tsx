'use client';

import { useEffect, useState } from 'react';

import type { BoostCatalogResponse, BoostIntentResponse } from '@community-marketplace/types';

import { monetizationService } from '@/services/monetization.service';
import { BoostCheckoutPanel } from '@/components/payments/boost-checkout-panel';

interface ListingBoostDialogProps {
  open: boolean;
  listingId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ListingBoostDialog({
  open,
  listingId,
  onClose,
  onSuccess,
}: ListingBoostDialogProps) {
  const [catalog, setCatalog] = useState<BoostCatalogResponse | null>(null);
  const [intent, setIntent] = useState<BoostIntentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCatalog(null);
      setIntent(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void monetizationService
      .getBoostCatalog(listingId)
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load boost options');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, listingId]);

  if (!open) return null;

  async function startCheckout(packageType: 'PAID_7D' | 'PAID_30D') {
    setLoading(true);
    setError(null);
    try {
      const response = await monetizationService.createBoostIntent({
        listingId,
        packageType,
      });
      setIntent(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal
        aria-labelledby="boost-dialog-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
      >
        <h2 id="boost-dialog-title" className="text-lg font-semibold text-gray-900">
          Boost listing
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Get higher search ranking and a Boosted badge for your listing.
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {loading && !catalog && !intent && (
          <p className="mt-4 text-sm text-gray-500">Loading boost options…</p>
        )}

        {catalog && !intent && (
          <div className="mt-4 space-y-2">
            {catalog.options.map((option) => (
              <button
                key={option.packageType}
                type="button"
                disabled={!option.eligible || loading}
                onClick={() => void startCheckout(option.packageType)}
                className="flex w-full items-start justify-between rounded-lg border border-gray-200 px-3 py-3 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>
                  <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                  <span className="block text-xs text-gray-500">
                    {option.durationDays} days · ranking bump + Boosted badge
                  </span>
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  €{option.price.toFixed(2)}
                </span>
              </button>
            ))}
            {catalog.listing?.isBoosted && catalog.listing.boostedUntil && (
              <p className="text-xs text-amber-700">
                Currently boosted until{' '}
                {new Date(catalog.listing.boostedUntil).toLocaleDateString()}. A new boost extends
                your time.
              </p>
            )}
          </div>
        )}

        {intent && (
          <div className="mt-4">
            <BoostCheckoutPanel
              intent={intent}
              onSuccess={() => {
                onSuccess();
                onClose();
              }}
            />
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
