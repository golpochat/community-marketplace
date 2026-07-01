'use client';

import { useEffect, useState } from 'react';

import type {
  StoreSlotCatalogResponse,
  StoreSlotIntentResponse,
} from '@community-marketplace/types';
import { Card } from '@community-marketplace/ui-dashboard';

import { BoostCheckoutPanel } from '@/components/payments/boost-checkout-panel';
import { monetizationService } from '@/services/monetization.service';

interface SellerStoreSlotPanelProps {
  onUpdated: () => void;
}

export function SellerStoreSlotPanel({ onUpdated }: SellerStoreSlotPanelProps) {
  const [catalog, setCatalog] = useState<StoreSlotCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSku, setSelectedSku] = useState<
    StoreSlotCatalogResponse['options'][number]['sku'] | null
  >(null);
  const [intent, setIntent] = useState<StoreSlotIntentResponse | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void monetizationService
      .getStoreSlotCatalog()
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load store slot options');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card title="Additional storefronts">
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading options…</p>
      </Card>
    );
  }

  const eligibleOptions = catalog?.options.filter((option) => option.eligible) ?? [];
  if (!catalog || eligibleOptions.length === 0) {
    return null;
  }

  async function startCheckout(sku: StoreSlotCatalogResponse['options'][number]['sku']) {
    setCheckoutLoading(true);
    setError(null);
    setSelectedSku(sku);
    try {
      const response = await monetizationService.createStoreSlotIntent({ sku });
      setIntent(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setSelectedSku(null);
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <Card title="Additional storefronts">
      <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
        You are using {catalog.storeCount} of {catalog.storeSlotLimit} storefront slot
        {catalog.storeSlotLimit === 1 ? '' : 's'}. Purchase an unlock to add another shop brand.
      </p>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {intent ? (
        <div className="mt-4">
          <BoostCheckoutPanel
            intent={intent}
            confirmPurchase={monetizationService.confirmStoreSlot}
            confirmLabel="Pay and unlock storefront"
            onSuccess={() => {
              setIntent(null);
              setSelectedSku(null);
              onUpdated();
            }}
          />
          <button
            type="button"
            className="mt-3 text-sm text-[hsl(var(--dashboard-sidebar-muted))] hover:underline"
            onClick={() => {
              setIntent(null);
              setSelectedSku(null);
            }}
          >
            Choose a different option
          </button>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {eligibleOptions.map((option) => (
            <li
              key={option.sku}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">{option.label}</p>
                <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                  Unlocks up to {catalog.storeSlotLimit + option.slotsGranted} storefront
                  {catalog.storeSlotLimit + option.slotsGranted === 1 ? '' : 's'}
                </p>
              </div>
              <button
                type="button"
                disabled={checkoutLoading && selectedSku === option.sku}
                onClick={() => void startCheckout(option.sku)}
                className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {checkoutLoading && selectedSku === option.sku
                  ? 'Starting…'
                  : `€${option.price.toFixed(2)}`}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
