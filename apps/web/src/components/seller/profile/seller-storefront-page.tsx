'use client';

import { PageHeader } from '@community-marketplace/ui-dashboard';

import { useSellerProfileData } from '@/hooks/use-seller-profile-data';

import { SellerStorefrontSettings } from './seller-storefront-settings';

export function SellerStorefrontPage() {
  const { profile, loading, error, reload } = useSellerProfileData();

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
        <SellerStorefrontSettings profile={profile} onSaved={() => void reload()} />
      )}
    </>
  );
}
