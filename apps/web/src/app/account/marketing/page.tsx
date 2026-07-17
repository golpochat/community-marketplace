'use client';

import { SellerCapabilityGate } from '@/components/account/seller-capability-gate';
import { SellerMarketingHubPage } from '@/components/seller/marketing-hub/seller-marketing-hub-page';

export default function Page() {
  return (
    <SellerCapabilityGate require="started">
      <SellerMarketingHubPage />
    </SellerCapabilityGate>
  );
}
