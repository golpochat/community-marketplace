'use client';

import { BuyerDisputesPage } from '@/components/disputes/buyer-disputes-page';
import { SellerDisputesPage } from '@/components/disputes/seller-disputes-page';
import { useSellerOnboarding } from '@/providers/seller-onboarding-provider';

export default function AccountDisputesPage() {
  const { phase, snapshot, loading } = useSellerOnboarding();

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading disputes…</p>;
  }

  if (phase === 'active_seller' || snapshot?.started || snapshot?.hasStorefront) {
    return <SellerDisputesPage />;
  }

  return <BuyerDisputesPage />;
}
