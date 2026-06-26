'use client';

import type { SellerStatus } from '@community-marketplace/types';
import { BadgeCheck } from 'lucide-react';

interface StoreVerificationLabelProps {
  sellerStatus?: SellerStatus;
  verified: boolean;
}

export function StoreVerificationLabel({ sellerStatus, verified }: StoreVerificationLabelProps) {
  if (verified || sellerStatus === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
        Verified Seller
      </span>
    );
  }

  if (sellerStatus === 'unverified' || sellerStatus === 'verification_required') {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        Unverified Seller
      </span>
    );
  }

  return null;
}
