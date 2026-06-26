'use client';

import type { AdminSellerVerificationRouteView } from '@/lib/admin-seller-verification-routes';
import { useAdminServiceRole } from '@/hooks/use-admin-service-role';

import { AdminSellerStatusHistoryPage } from './admin-seller-status-history-page';
import { AdminSellerVerificationPage } from './admin-seller-verification-page';

export function AdminSellerVerificationRoute({
  view,
}: {
  view: AdminSellerVerificationRouteView;
}) {
  const role = useAdminServiceRole();

  if (view === 'history') {
    return <AdminSellerStatusHistoryPage role={role} />;
  }

  return <AdminSellerVerificationPage role={role} view={view} />;
}
