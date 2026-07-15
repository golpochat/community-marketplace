'use client';

import { SellerCapabilityGate } from '@/components/account/seller-capability-gate';
import { SellerCreateListingPage } from '@/components/seller/seller-resource-pages';

export default function Page() {
  return (
    <SellerCapabilityGate>
      <SellerCreateListingPage />
    </SellerCapabilityGate>
  );
}
