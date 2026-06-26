'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function RedirectToProfileVerification() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/seller/profile?tab=verification');
  }, [router]);

  return (
    <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Redirecting to verification…</p>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Redirecting…</p>
      }
    >
      <RedirectToProfileVerification />
    </Suspense>
  );
}
