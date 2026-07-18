'use client';

import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';

import { SellerCapabilityGate } from '@/components/account/seller-capability-gate';
import { SellerEditListingPage } from '@/components/seller/seller-resource-pages';

interface PageProps {
  params: Promise<{ id: string }>;
}

function AccountEditListingRoute({ listingId }: { listingId: string }) {
  const searchParams = useSearchParams();
  const duplicatedHint = searchParams.get('duplicated') === '1';
  const stepSlug = searchParams.get('step') ?? undefined;

  return (
    <SellerEditListingPage
      listingId={listingId}
      duplicatedHint={duplicatedHint}
      stepSlug={stepSlug}
    />
  );
}

export default function Page({ params }: PageProps) {
  const { id } = use(params);

  return (
    <SellerCapabilityGate>
      <Suspense
        fallback={
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
        }
      >
        <AccountEditListingRoute listingId={id} />
      </Suspense>
    </SellerCapabilityGate>
  );
}
