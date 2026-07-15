'use client';

import { SellerCapabilityGate } from '@/components/account/seller-capability-gate';
import { SellerListingsPage } from '@/components/seller/seller-resource-pages';

export default function Page() {
  return (
    <SellerCapabilityGate>
      <SellerListingsPage />
    </SellerCapabilityGate>
  );
}
