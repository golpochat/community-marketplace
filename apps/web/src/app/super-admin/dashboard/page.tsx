'use client';

import { AdminDashboardHome } from '@/components/dashboard/admin-dashboard-home';

export default function SuperAdminOverviewPage() {
  return (
    <AdminDashboardHome
      role="SUPER_ADMIN"
      title="Overview"
      description="Platform-wide metrics and system health at a glance."
    />
  );
}
