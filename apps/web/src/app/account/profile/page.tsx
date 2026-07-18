'use client';

import { BuyerProfilePage } from '@/components/buyer/profile/buyer-profile-page';
import { LoadingState } from '@/components/LoadingState';
import { SellerProfilePage } from '@/components/seller/profile/seller-profile-page';
import { useSellerOnboarding } from '@/providers/seller-onboarding-provider';

export default function Page() {
  const { phase, loading } = useSellerOnboarding();

  if (loading) {
    return <LoadingState />;
  }

  if (phase === 'buyer_only') {
    return <BuyerProfilePage />;
  }

  return <SellerProfilePage />;
}
