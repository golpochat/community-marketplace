'use client';

import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';

import { SellerEditListingPage } from '@/components/seller/seller-resource-pages';

interface PageProps {
  params: Promise<{ id: string }>;
}

function SellerEditListingRoute({ listingId }: { listingId: string }) {
  const searchParams = useSearchParams();
  const duplicatedHint = searchParams.get('duplicated') === '1';

  return (
    <SellerEditListingPage listingId={listingId} duplicatedHint={duplicatedHint} />
  );
}

export default function Page({ params }: PageProps) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
      }
    >
      <SellerEditListingRoute listingId={id} />
    </Suspense>
  );
}
