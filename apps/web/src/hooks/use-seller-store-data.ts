'use client';

import { useCallback, useEffect, useState } from 'react';

import type { SellerStore, SellerStoreLimits, SellerStoresOverview } from '@community-marketplace/types';

import { sellerService } from '@/services/marketplace.service';

export function useSellerStoreData() {
  const [overview, setOverview] = useState<SellerStoresOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sellerService.getStoresOverview();
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load storefront');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const primaryStore =
    overview?.stores.find((store) => store.isPrimary) ?? overview?.stores[0] ?? null;

  return {
    overview,
    stores: overview?.stores ?? [],
    limits: overview?.limits ?? null,
    primaryStore,
    loading,
    error,
    reload: load,
  };
}

export function isStorefrontComplete(store: SellerStore | null | undefined): boolean {
  return Boolean(store?.name?.trim() && store?.description?.trim() && store?.logoUrl);
}

export function formatStoreLimits(limits: SellerStoreLimits | null): string | null {
  if (!limits) return null;
  return `${limits.storeCount} of ${limits.storeSlotLimit} storefront slot${limits.storeSlotLimit === 1 ? '' : 's'} used`;
}
