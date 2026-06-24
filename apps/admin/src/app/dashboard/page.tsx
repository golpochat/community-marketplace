import type { AdminDashboardStats } from '@community-marketplace/types';

import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { adminServerService } from '@/services/admin.service.server';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const stats = (await adminServerService.getStats()) as AdminDashboardStats;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Dashboard Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">Platform metrics at a glance</p>
      <div className="mt-8">
        <DashboardOverview stats={stats} />
      </div>
    </div>
  );
}
