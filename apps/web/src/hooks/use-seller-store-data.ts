'use client';

import { useCallback, useEffect, useState } from 'react';

import type { SellerStore, SellerStoreLimits, SellerStoresOverview } from '@community-marketplace/types';

import { sellerService } from '@/services/marketplace.service';

export function useSellerStoreData(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [overview, setOverview] = useState<SellerStoresOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (loadOptions?: { silent?: boolean }) => {
    if (!enabled) {
      setOverview(null);
      setLoading(false);
      setError(null);
      return;
    }

    const silent = loadOptions?.silent ?? false;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await sellerService.getStoresOverview();
      setOverview(data);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to load storefront');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => load({ silent: true }), [load]);

  const primaryStore =
    overview?.stores.find((store) => store.isPrimary) ?? overview?.stores[0] ?? null;

  return {
    overview,
    stores: overview?.stores ?? [],
    limits: overview?.limits ?? null,
    primaryStore,
    loading: enabled ? loading : false,
    error,
    reload,
  };
}

export function isStorefrontComplete(store: SellerStore | null | undefined): boolean {
  return Boolean(store?.name?.trim() && store?.description?.trim() && store?.logoUrl);
}

export function formatStoreLimits(limits: SellerStoreLimits | null): string | null {
  if (!limits) return null;
  return `${limits.storeCount} of ${limits.storeSlotLimit} storefront slot${limits.storeSlotLimit === 1 ? '' : 's'} used`;
}
