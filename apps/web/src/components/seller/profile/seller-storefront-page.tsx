'use client';

import { PageHeader } from '@community-marketplace/ui-dashboard';

import { useSellerStoreData } from '@/hooks/use-seller-store-data';

import { SellerStorefrontSettings } from './seller-storefront-settings';

export function SellerStorefrontPage() {
  const { stores, limits, loading, error, reload } = useSellerStoreData();

  return (
    <>
      <PageHeader
        title="Storefront"
        description="Manage your public shop page — logo, banner, name, and description."
      />
      {loading && (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {!loading && (
        <SellerStorefrontSettings
          stores={stores}
          limits={limits}
          onSaved={() => void reload()}
        />
      )}
    </>
  );
}
