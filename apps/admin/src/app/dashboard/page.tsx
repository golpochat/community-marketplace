import { formatCurrency } from '@community-marketplace/utils';

import { StatCard } from '@/components/dashboard/stat-card';
import { adminService } from '@/services/admin.service';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const stats = await adminService.getStats();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Dashboard Overview</h1>
      <p className="mt-1 text-sm text-gray-600">Platform metrics at a glance</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={String(stats.totalUsers)} />
        <StatCard label="Active Listings" value={String(stats.activeListings)} />
        <StatCard label="Revenue" value={formatCurrency(stats.revenue)} />
        <StatCard label="Pending Reports" value={String(stats.pendingReports)} />
      </div>
    </div>
  );
}
