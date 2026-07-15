'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { WEB_APP_ROUTES } from '@/lib/rbac-routes';
import { useSellerOnboarding } from '@/providers/seller-onboarding-provider';

interface SellerCapabilityGateProps {
  children: ReactNode;
}

/** Redirects buyers who have not started selling to the unified seller hub. */
export function SellerCapabilityGate({ children }: SellerCapabilityGateProps) {
  const router = useRouter();
  const { phase, loading } = useSellerOnboarding();

  useEffect(() => {
    if (!loading && phase === 'buyer_only') {
      router.replace(WEB_APP_ROUTES.accountSelling);
    }
  }, [loading, phase, router]);

  if (loading || phase === 'buyer_only') {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Loading seller tools…
      </p>
    );
  }

  return children;
}
