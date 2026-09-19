'use client';

import { use } from 'react';

import { BuyerDisputeDetailPage } from '@/components/disputes/buyer-dispute-detail-page';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BuyerDisputeDetailPage disputeId={id} />;
}
