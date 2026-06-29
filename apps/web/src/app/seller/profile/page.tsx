'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { SellerProfilePage } from '@/components/seller/profile/seller-profile-page';
import { SELLER_ROUTES, resolveSellerProfileRedirect } from '@/lib/seller-routes';

function SellerProfileRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  useEffect(() => {
    if (!tab) return;
    const destination = resolveSellerProfileRedirect(tab);
    if (destination !== SELLER_ROUTES.profile || tab !== 'profile') {
      router.replace(destination);
    }
  }, [router, tab]);

  if (tab && tab !== 'profile') {
    return (
      <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Redirecting…</p>
    );
  }

  return <SellerProfilePage />;
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
      }
    >
      <SellerProfileRoute />
    </Suspense>
  );
}
