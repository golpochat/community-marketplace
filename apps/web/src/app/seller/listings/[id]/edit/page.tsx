'use client';

import { use } from 'react';

import { SellerEditListingPage } from '@/components/seller/seller-resource-pages';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
  const { id } = use(params);
  return <SellerEditListingPage listingId={id} />;
}
