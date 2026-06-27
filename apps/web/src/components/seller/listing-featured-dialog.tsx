'use client';

import { useEffect, useState } from 'react';

import type {
  FeaturedCatalogResponse,
  FeaturedIntentResponse,
  FeaturedPlacement,
} from '@community-marketplace/types';

import { monetizationService } from '@/services/monetization.service';
import { BoostCheckoutPanel } from '@/components/payments/boost-checkout-panel';

interface ListingFeaturedDialogProps {
  open: boolean;
  listingId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function slotAvailabilityText(option: FeaturedCatalogResponse['options'][number]): string {
  if (option.slotsRemaining <= 0) {
    return 'No slots available today';
  }
  return `${option.slotsRemaining} of ${option.slotsPerDay} slots left today`;
}

export function ListingFeaturedDialog({
  open,
  listingId,
  onClose,
  onSuccess,
}: ListingFeaturedDialogProps) {
  const [catalog, setCatalog] = useState<FeaturedCatalogResponse | null>(null);
  const [intent, setIntent] = useState<FeaturedIntentResponse | null>(null);
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
      .getFeaturedCatalog(listingId)
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load featured options');
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

  async function startCheckout(placement: FeaturedPlacement) {
    setLoading(true);
    setError(null);
    try {
      const response = await monetizationService.createFeaturedIntent({
        listingId,
        placement,
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
        aria-labelledby="featured-dialog-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
      >
        <h2 id="featured-dialog-title" className="text-lg font-semibold text-gray-900">
          Feature listing
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Get premium placement on the homepage or in your category for 24 hours.
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {loading && !catalog && !intent && (
          <p className="mt-4 text-sm text-gray-500">Loading featured options…</p>
        )}

        {catalog && !intent && (
          <div className="mt-4 space-y-2">
            {!catalog.featuredEnabled && (
              <p className="text-sm text-gray-500">Featured listings are not available right now.</p>
            )}
            {catalog.options.map((option) => (
              <button
                key={option.placement}
                type="button"
                disabled={!catalog.featuredEnabled || !option.eligible || loading}
                onClick={() => void startCheckout(option.placement)}
                className="flex w-full items-start justify-between rounded-lg border border-gray-200 px-3 py-3 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>
                  <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                  <span className="block text-xs text-gray-500">
                    {option.durationHours}h · Featured badge + premium placement
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {slotAvailabilityText(option)}
                  </span>
                  {option.reason && (
                    <span className="mt-1 block text-xs text-amber-700">{option.reason}</span>
                  )}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  €{option.price.toFixed(2)}
                </span>
              </button>
            ))}
            {catalog.listing?.isFeatured && catalog.listing.featuredUntil && (
              <p className="text-xs text-indigo-700">
                Currently featured until{' '}
                {new Date(catalog.listing.featuredUntil).toLocaleDateString()}.
                {catalog.listing.featuredPlacement
                  ? ` (${catalog.listing.featuredPlacement})`
                  : ''}
              </p>
            )}
          </div>
        )}

        {intent && (
          <div className="mt-4">
            <BoostCheckoutPanel
              intent={intent}
              confirmPurchase={monetizationService.confirmFeatured}
              confirmLabel="Pay and feature"
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
