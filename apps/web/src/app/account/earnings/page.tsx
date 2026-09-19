'use client';

import { SellerCapabilityGate } from '@/components/account/seller-capability-gate';
import SellerEarningsPage from '@/views/earnings-page';

export default function Page() {
  return (
    <SellerCapabilityGate>
      <SellerEarningsPage />
    </SellerCapabilityGate>
  );
}
