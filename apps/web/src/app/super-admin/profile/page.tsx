'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { StaffProfilePage } from '@/components/dashboard/staff-profile-page';
import {
  SUPER_ADMIN_PERSONAL_ROUTES,
  resolveSuperAdminProfileRedirect,
} from '@/lib/admin-routes';

function SuperAdminProfileRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  useEffect(() => {
    if (!tab) return;
    const destination = resolveSuperAdminProfileRedirect(tab);
    if (destination !== SUPER_ADMIN_PERSONAL_ROUTES.profile || tab !== 'profile') {
      router.replace(destination);
    }
  }, [router, tab]);

  if (tab && tab !== 'profile') {
    return (
      <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Redirecting…</p>
    );
  }

  return <StaffProfilePage />;
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
      }
    >
      <SuperAdminProfileRoute />
    </Suspense>
  );
}
