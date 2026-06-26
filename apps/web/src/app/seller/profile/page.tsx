'use client';

import { Suspense } from 'react';

import { SellerProfilePage } from '@/components/seller/profile/seller-profile-page';

export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading profile…</p>
      }
    >
      <SellerProfilePage />
    </Suspense>
  );
}
