'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { BuyerProfilePage } from '@/components/buyer/profile/buyer-profile-page';
import { BUYER_ROUTES, resolveBuyerProfileRedirect } from '@/lib/buyer-routes';

function BuyerProfileRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  useEffect(() => {
    if (!tab) return;
    const destination = resolveBuyerProfileRedirect(tab);
    if (destination !== BUYER_ROUTES.profile || tab !== 'profile') {
      router.replace(destination);
    }
  }, [router, tab]);

  if (tab && tab !== 'profile') {
    return (
      <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Redirecting…</p>
    );
  }

  return <BuyerProfilePage />;
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
      }
    >
      <BuyerProfileRoute />
    </Suspense>
  );
}
