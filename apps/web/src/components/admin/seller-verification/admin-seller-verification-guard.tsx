'use client';

import { DashboardPageShell } from '@/components/dashboard/async-resource';
import { usePermissions } from '@/hooks/use-permissions';
import { canReviewSellerVerification } from '@/lib/admin-sidebar';

export function AdminSellerVerificationGuard({ children }: { children: React.ReactNode }) {
  const { permissions, role, loading } = usePermissions();

  if (loading) {
    return (
      <DashboardPageShell
        title="Seller Verification"
        description="Review seller identity verification requests."
        loading
        error={null}
        empty={false}
      >
        <div />
      </DashboardPageShell>
    );
  }

  if (!canReviewSellerVerification(role, permissions)) {
    return (
      <DashboardPageShell
        title="Seller Verification"
        description="Review seller identity verification requests."
        loading={false}
        error="Insufficient permissions"
        empty={false}
      >
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          You do not have permission to access this module. Contact a super admin if you need{' '}
          <code className="rounded bg-[hsl(var(--dashboard-sidebar-active)/0.5)] px-1">review_seller_verification</code>.
        </p>
      </DashboardPageShell>
    );
  }

  return <>{children}</>;
}
