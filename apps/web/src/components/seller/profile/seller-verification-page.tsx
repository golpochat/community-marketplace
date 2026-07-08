'use client';

import { PageHeader } from '@community-marketplace/ui-dashboard';
import { VERIFICATION_ONBOARDING_COPY } from '@community-marketplace/types';

import { useSellerProfileData } from '@/hooks/use-seller-profile-data';
import { VerificationOnboardingCopy } from '@/components/seller/verification';

import { SellerVerificationFlow } from './seller-verification-flow';

export function SellerVerificationPage() {
  const { loading, error, reload } = useSellerProfileData();

  return (
    <>
      <PageHeader
        title="Verification"
        description={VERIFICATION_ONBOARDING_COPY.VERIFICATION_PAGE_SUBTITLE}
      />
      <div className="mb-6">
        <VerificationOnboardingCopy />
      </div>
      {loading && (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {!loading && <SellerVerificationFlow onSubmitted={() => void reload()} />}
    </>
  );
}
