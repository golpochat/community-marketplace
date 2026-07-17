'use client';

import { useEffect, useState } from 'react';

import type {
  FeaturedStoreCatalogResponse,
  FeaturedStoreIntentResponse,
} from '@community-marketplace/types';

import { BoostCheckoutPanel } from '@/components/payments/boost-checkout-panel';
import { monetizationService } from '@/services/monetization.service';

interface FeaturedStoreDialogProps {
  open: boolean;
  storeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function FeaturedStoreDialog({
  open,
  storeId,
  onClose,
  onSuccess,
}: FeaturedStoreDialogProps) {
  const [catalog, setCatalog] = useState<FeaturedStoreCatalogResponse | null>(null);
  const [intent, setIntent] = useState<FeaturedStoreIntentResponse | null>(null);
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
      .getFeaturedStoreCatalog(storeId)
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load featured store options',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, storeId]);

  if (!open) return null;

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await monetizationService.createFeaturedStoreIntent({
        storeId,
      });
      setIntent(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  }

  const option = catalog?.option;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal
        aria-labelledby="featured-store-dialog-title"
        className="w-full max-w-md rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] p-6 shadow-lg"
      >
        <h2
          id="featured-store-dialog-title"
          className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]"
        >
          Feature this shop
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          Homepage placement for {catalog?.store.name ?? 'your storefront'} — appears in
          Featured shops for {option?.durationHours ?? 24} hours.
        </p>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {loading && !catalog && !intent && (
          <p className="mt-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Loading…
          </p>
        )}

        {catalog && !catalog.featuredEnabled && !intent && (
          <p className="mt-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Featured storefronts are not available right now.
          </p>
        )}

        {option && !intent && catalog?.featuredEnabled && (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-3">
              <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
                €{option.amount.toFixed(2)} · {option.durationHours}h homepage
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                {option.slotsRemaining <= 0
                  ? 'No slots available today'
                  : `${option.slotsRemaining} of ${option.slotsPerDay} slots left today`}
              </p>
            </div>
            {catalog.store.isFeatured && catalog.store.featuredUntil && (
              <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                Currently featured until{' '}
                {new Date(catalog.store.featuredUntil).toLocaleString()}. Buying again
                extends the window.
              </p>
            )}
            <button
              type="button"
              disabled={!option.eligible || loading}
              onClick={() => void startCheckout()}
              className="w-full rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? 'Starting…' : 'Feature shop'}
            </button>
            {!option.eligible && option.reason && (
              <p className="text-xs text-amber-700">{option.reason}</p>
            )}
          </div>
        )}

        {intent && (
          <div className="mt-4">
            <BoostCheckoutPanel
              intent={intent}
              confirmPurchase={monetizationService.confirmFeaturedStore}
              confirmLabel="Pay to feature shop"
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
            className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
