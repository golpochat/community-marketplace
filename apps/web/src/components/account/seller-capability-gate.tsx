'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { WEB_APP_ROUTES } from '@/lib/rbac-routes';
import { SELLER_ROUTES } from '@/lib/seller-routes';
import { useSellerOnboarding } from '@/providers/seller-onboarding-provider';

interface SellerCapabilityGateProps {
  children: ReactNode;
  /**
   * `started` — any seller who opted in (setup or active).
   * `storefront` — listing/earnings tools; redirects until a storefront exists.
   */
  require?: 'started' | 'storefront';
}

/**
 * Gates seller account tools.
 * - Buyers who have not started selling → /account/selling
 * - Opted-in sellers without a storefront (when require=storefront) → /account/storefront
 */
export function SellerCapabilityGate({
  children,
  require = 'storefront',
}: SellerCapabilityGateProps) {
  const router = useRouter();
  const { phase, loading } = useSellerOnboarding();

  useEffect(() => {
    if (loading) return;

    if (phase === 'buyer_only') {
      router.replace(WEB_APP_ROUTES.accountSelling);
      return;
    }

    if (require === 'storefront' && phase === 'setup_in_progress') {
      router.replace(SELLER_ROUTES.storefront);
    }
  }, [loading, phase, require, router]);

  if (loading || phase === 'buyer_only') {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Redirecting…
      </p>
    );
  }

  if (require === 'storefront' && phase === 'setup_in_progress') {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Set up your storefront before using listing tools. Redirecting…
      </p>
    );
  }

  return children;
}
