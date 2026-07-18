'use client';

import { Suspense } from 'react';

import { SellerCapabilityGate } from '@/components/account/seller-capability-gate';
import { SellerVerificationPage } from '@/components/seller/profile/seller-verification-page';

export default function AccountVerificationPage() {
  return (
    <SellerCapabilityGate require="started">
      <Suspense
        fallback={
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
        }
      >
        <SellerVerificationPage />
      </Suspense>
    </SellerCapabilityGate>
  );
}
