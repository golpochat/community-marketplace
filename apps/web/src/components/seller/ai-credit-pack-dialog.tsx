'use client';

import { useEffect, useState } from 'react';

import type {
  AiCreditPackCatalogResponse,
  AiCreditPackIntentResponse,
  AiCreditPackSku,
} from '@community-marketplace/types';

import { BoostCheckoutPanel } from '@/components/payments/boost-checkout-panel';
import { monetizationService } from '@/services/monetization.service';

interface AiCreditPackDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AiCreditPackDialog({
  open,
  onClose,
  onSuccess,
}: AiCreditPackDialogProps) {
  const [catalog, setCatalog] = useState<AiCreditPackCatalogResponse | null>(null);
  const [intent, setIntent] = useState<AiCreditPackIntentResponse | null>(null);
  const [selectedSku, setSelectedSku] = useState<AiCreditPackSku | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCatalog(null);
      setIntent(null);
      setSelectedSku(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void monetizationService
      .getAiCreditPackCatalog()
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load AI credit packs',
          );
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

  async function startCheckout(sku: AiCreditPackSku) {
    setLoading(true);
    setError(null);
    setSelectedSku(sku);
    try {
      const response = await monetizationService.createAiCreditPackIntent({ sku });
      setIntent(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setSelectedSku(null);
    } finally {
      setLoading(false);
    }
  }

  const options = catalog?.options.filter((option) => option.enabled) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal
        aria-labelledby="ai-credit-pack-dialog-title"
        className="w-full max-w-md rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] p-6 shadow-lg"
      >
        <h2
          id="ai-credit-pack-dialog-title"
          className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]"
        >
          Top up AI credits
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          Add SellNearby Credit for Marketing Hub overage (€0.05 per unit after your free
          monthly allowance).
        </p>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {loading && !catalog && !intent && (
          <p className="mt-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Loading…
          </p>
        )}

        {options.length > 0 && !intent && (
          <div className="mt-4 space-y-2">
            {options.map((option) => (
              <button
                key={option.sku}
                type="button"
                disabled={!option.eligible || loading}
                onClick={() => void startCheckout(option.sku)}
                className="flex w-full items-center justify-between rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-3 text-left hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)] disabled:opacity-50"
              >
                <span>
                  <span className="block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                    ~{option.approxUnits} units · face value €
                    {option.walletCreditEur.toFixed(2)}
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums text-[hsl(var(--dashboard-main-fg))]">
                  €{option.amount.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        )}

        {intent && selectedSku && (
          <div className="mt-4">
            <BoostCheckoutPanel
              intent={intent}
              confirmPurchase={monetizationService.confirmAiCreditPack}
              confirmLabel="Pay for AI credits"
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
