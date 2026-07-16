'use client';

import { SellerCapabilityGate } from '@/components/account/seller-capability-gate';
import { SellerStorefrontPage } from '@/components/seller/profile/seller-storefront-page';

export default function Page() {
  return (
    <SellerCapabilityGate require="started">
      <SellerStorefrontPage />
    </SellerCapabilityGate>
  );
}
