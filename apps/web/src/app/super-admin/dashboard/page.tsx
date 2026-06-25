'use client';

import { SuperAdminDashboardHome } from '@/components/dashboard/super-admin-dashboard-home';

export default function SuperAdminOverviewPage() {
  return (
    <SuperAdminDashboardHome
      title="Overview"
      description="Platform-wide metrics and system health at a glance."
    />
  );
}
