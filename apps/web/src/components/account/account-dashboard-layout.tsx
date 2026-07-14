'use client';

import type { RbacRole } from '@community-marketplace/types';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/use-auth';

export function AccountDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const role: RbacRole = user?.role === 'SELLER' || user?.role === 'BUYER' ? user.role : 'MEMBER';

  return (
    <DashboardLayout role={role} theme="buyer">
      {children}
    </DashboardLayout>
  );
}
