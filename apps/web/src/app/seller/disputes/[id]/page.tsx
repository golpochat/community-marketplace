'use client';

import { use } from 'react';

import { SellerDisputeDetailPage } from '@/components/disputes/seller-dispute-detail-page';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SellerDisputeDetailPage disputeId={id} />;
}
