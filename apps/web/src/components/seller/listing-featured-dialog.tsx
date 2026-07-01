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
  const [completedPurchaseId, setCompletedPurchaseId] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCatalog(null);
      setIntent(null);
      setCompletedPurchaseId(null);
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
      const categoryId = catalog?.listing?.categoryId;
      if (placement === 'category' && !categoryId) {
        setError('This listing has no category. Edit the listing and choose a category first.');
        return;
      }

      const response = await monetizationService.createFeaturedIntent({
        listingId,
        placement,
        ...(placement === 'category' ? { categoryId: categoryId! } : {}),
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
        className="w-full max-w-md rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] p-6 shadow-lg"
      >
        <h2 id="featured-dialog-title" className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]">
          Feature listing
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          Get premium placement on the homepage or in your category for 24 hours.
        </p>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {loading && !catalog && !intent && (
          <p className="mt-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading featured options…</p>
        )}

        {completedPurchaseId && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
            <p className="font-medium">Payment successful — your listing is now featured.</p>
            <p className="mt-1 text-green-800">
              Your PDF invoice was emailed to you. You can also download it below.
            </p>
            <button
              type="button"
              disabled={downloadingInvoice}
              onClick={() => {
                setDownloadingInvoice(true);
                void monetizationService
                  .downloadSellerInvoice(completedPurchaseId)
                  .catch((err) => {
                    setError(err instanceof Error ? err.message : 'Failed to download invoice');
                  })
                  .finally(() => setDownloadingInvoice(false));
              }}
              className="mt-3 rounded-md border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-900 hover:bg-green-100 disabled:opacity-50"
            >
              {downloadingInvoice ? 'Downloading…' : 'Download invoice'}
            </button>
          </div>
        )}

        {catalog && !intent && !completedPurchaseId && (
          <div className="mt-4 space-y-2">
            {!catalog.featuredEnabled && (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Featured listings are not available right now.</p>
            )}
            {catalog.options.map((option) => (
              <button
                key={option.placement}
                type="button"
                disabled={!catalog.featuredEnabled || !option.eligible || loading}
                onClick={() => void startCheckout(option.placement)}
                className="flex w-full items-start justify-between rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-3 text-left hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>
                  <span className="block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">{option.label}</span>
                  <span className="block text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                    {option.durationHours}h · Featured badge + premium placement
                  </span>
                  <span className="mt-1 block text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                    {slotAvailabilityText(option)}
                  </span>
                  {option.reason && (
                    <span className="mt-1 block text-xs text-amber-700">{option.reason}</span>
                  )}
                </span>
                <span className="text-sm font-semibold text-[hsl(var(--dashboard-main-fg))]">
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

        {intent && !completedPurchaseId && (
          <div className="mt-4">
            <BoostCheckoutPanel
              intent={intent}
              confirmPurchase={monetizationService.confirmFeatured}
              confirmLabel="Pay and feature"
              onSuccess={() => {
                setCompletedPurchaseId(intent.purchase.id);
                setIntent(null);
                onSuccess();
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
