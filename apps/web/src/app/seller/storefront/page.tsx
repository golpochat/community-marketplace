import { Suspense } from 'react';

import { LoadingState } from '@/components/LoadingState';
import { SellerStorefrontPage } from '@/components/seller/profile/seller-storefront-page';

export default function Page() {
  return (
    <Suspense fallback={<LoadingState message="Loading storefront…" />}>
      <SellerStorefrontPage />
    </Suspense>
  );
}
