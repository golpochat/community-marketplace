'use client';

import { SellerCapabilityGate } from '@/components/account/seller-capability-gate';
import SellerEarningsPage from '../../seller/earnings/page';

export default function Page() {
  return (
    <SellerCapabilityGate>
      <SellerEarningsPage />
    </SellerCapabilityGate>
  );
}
