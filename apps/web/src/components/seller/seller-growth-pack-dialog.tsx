'use client';

import { useEffect, useState } from 'react';

import type { GrowthPackCatalogResponse, GrowthPackIntentResponse } from '@community-marketplace/types';

import { BoostCheckoutPanel } from '@/components/payments/boost-checkout-panel';
import { monetizationService } from '@/services/monetization.service';

interface SellerGrowthPackDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SellerGrowthPackDialog({
  open,
  onClose,
  onSuccess,
}: SellerGrowthPackDialogProps) {
  const [catalog, setCatalog] = useState<GrowthPackCatalogResponse | null>(null);
  const [intent, setIntent] = useState<GrowthPackIntentResponse | null>(null);
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
      .getGrowthPackCatalog()
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load Growth Pack');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await monetizationService.createGrowthPackIntent();
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
        aria-labelledby="growth-pack-dialog-title"
        className="w-full max-w-md rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] p-6 shadow-lg"
      >
        <h2
          id="growth-pack-dialog-title"
          className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]"
        >
          Seller Growth Pack
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          SellNearby Credit for AI overage, plus a one-time discount on your next
          Marketing Hub boost.
        </p>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {loading && !catalog && !intent && (
          <p className="mt-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Loading…
          </p>
        )}

        {option && !intent && (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-3">
              <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
                €{option.amount.toFixed(2)}
              </p>
              <ul className="mt-2 list-inside list-disc text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                <li>€{option.walletCreditEur.toFixed(2)} SellNearby Credit</li>
                <li>
                  {option.boostDiscountPercent}% off one Marketing Hub boost
                </li>
              </ul>
            </div>
            <button
              type="button"
              disabled={!option.eligible || loading}
              onClick={() => void startCheckout()}
              className="w-full rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? 'Starting…' : 'Buy Growth Pack'}
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
              confirmPurchase={monetizationService.confirmGrowthPack}
              confirmLabel="Pay for Growth Pack"
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
