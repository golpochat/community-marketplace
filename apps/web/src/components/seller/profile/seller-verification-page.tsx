'use client';

import { PageHeader } from '@community-marketplace/ui-dashboard';

import { useSellerProfileData } from '@/hooks/use-seller-profile-data';

import { SellerVerificationFlow } from './seller-verification-flow';

export function SellerVerificationPage() {
  const { loading, error, reload } = useSellerProfileData();

  return (
    <>
      <PageHeader
        title="Verification"
        description="Verify your identity to unlock unlimited listings and the trusted seller badge."
      />
      {loading && (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {!loading && <SellerVerificationFlow onSubmitted={() => void reload()} />}
    </>
  );
}
