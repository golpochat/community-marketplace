'use client';

import { PageHeader } from '@community-marketplace/ui-dashboard';

import { useSellerStoreData } from '@/hooks/use-seller-store-data';
import { useSellerOnboarding } from '@/providers/seller-onboarding-provider';

import { SellerStorefrontSettings } from './seller-storefront-settings';

export function SellerStorefrontPage() {
  const { stores, limits, loading, error, reload } = useSellerStoreData();
  const { refresh: refreshOnboarding } = useSellerOnboarding();
  const isInitialLoad = loading && stores.length === 0;

  async function handleSaved() {
    await reload();
    await refreshOnboarding();
  }

  return (
    <>
      <PageHeader
        title="Storefront"
        description="Set up your public shop first — at least a store name — before creating listings."
      />
      {isInitialLoad && (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {!isInitialLoad && (
        <SellerStorefrontSettings
          stores={stores}
          limits={limits}
          onSaved={() => void handleSaved()}
        />
      )}
    </>
  );
}
