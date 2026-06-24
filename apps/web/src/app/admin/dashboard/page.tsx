'use client';

import { AdminDashboardHome } from '@/components/dashboard/admin-dashboard-home';

export default function AdminDashboardPage() {
  return (
    <AdminDashboardHome
      role="ADMIN"
      title="Dashboard"
      description="Key metrics and operational summary for your admin scope."
    />
  );
}
