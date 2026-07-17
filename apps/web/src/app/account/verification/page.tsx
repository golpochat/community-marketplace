'use client';

import { SellerCapabilityGate } from '@/components/account/seller-capability-gate';
import { SellerVerificationPage } from '@/components/seller/profile/seller-verification-page';

export default function AccountVerificationPage() {
  return (
    <SellerCapabilityGate require="started">
      <SellerVerificationPage />
    </SellerCapabilityGate>
  );
}
