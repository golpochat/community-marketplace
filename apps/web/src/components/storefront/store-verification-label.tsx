'use client';

import type { SellerStatus } from '@community-marketplace/types';

import { VerifiedSellerIcon } from '@/components/trust/verified-seller-icon';

interface StoreVerificationLabelProps {
  sellerStatus?: SellerStatus;
  verified: boolean;
}

/** Icon-only verified mark beside the store name. */
export function StoreVerificationLabel({ sellerStatus, verified }: StoreVerificationLabelProps) {
  if (verified || sellerStatus === 'verified') {
    return <VerifiedSellerIcon size="lg" />;
  }

  return null;
}
