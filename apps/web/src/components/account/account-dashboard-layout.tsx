'use client';

import type { RbacRole } from '@community-marketplace/types';
import { useMemo } from 'react';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/use-auth';
import { buildAccountSidebarItems } from '@/lib/account-sidebar';
import { SellerOnboardingProvider, useSellerOnboarding } from '@/providers/seller-onboarding-provider';

function AccountDashboardShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { phase, loading } = useSellerOnboarding();
  const role: RbacRole = user?.role === 'SELLER' || user?.role === 'BUYER' ? user.role : 'MEMBER';

  const sidebarItems = useMemo(
    () => buildAccountSidebarItems(phase, { loading }),
    [phase, loading],
  );

  return (
    <DashboardLayout role={role} theme="buyer" sidebarItems={sidebarItems}>
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
