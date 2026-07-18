'use client';

import type { RbacRole } from '@community-marketplace/types';
import { isSellerVerified } from '@community-marketplace/types';
import { useMemo } from 'react';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { VerificationNudgeHost } from '@/components/seller/verification';
import { useAuth } from '@/hooks/use-auth';
import { buildAccountSidebarItems } from '@/lib/account-sidebar';
import { SELLER_ROUTES } from '@/lib/seller-routes';
import { SellerOnboardingProvider, useSellerOnboarding } from '@/providers/seller-onboarding-provider';

function AccountDashboardShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { phase, loading, snapshot } = useSellerOnboarding();
  const role: RbacRole = user?.role === 'SELLER' || user?.role === 'BUYER' ? user.role : 'MEMBER';
  const theme = phase === 'active_seller' || phase === 'setup_in_progress' ? 'seller' : 'buyer';
  const verified = isSellerVerified(snapshot?.sellerStatus);
  const showGetVerified =
    !verified && Boolean(snapshot?.started) && phase !== 'buyer_only';

  const sidebarItems = useMemo(
    () => buildAccountSidebarItems(phase, { loading }),
    [phase, loading],
  );

  return (
    <DashboardLayout
      role={role}
      theme={theme}
      sidebarItems={sidebarItems}
      verified={verified}
      verifyHref={showGetVerified ? SELLER_ROUTES.verification : undefined}
    >
      <VerificationNudgeHost />
      {children}
    </DashboardLayout>
  );
}

export function AccountDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SellerOnboardingProvider>
      <AccountDashboardShell>{children}</AccountDashboardShell>
    </SellerOnboardingProvider>
  );
}
