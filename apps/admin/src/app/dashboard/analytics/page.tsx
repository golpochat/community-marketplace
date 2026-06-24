import type { AdminDashboardStats } from '@community-marketplace/types';
import { BarChart, Card, CardContent, CardHeader, CardTitle } from '@community-marketplace/ui';

import { requireAdminPermission } from '@/lib/server-rbac';
import { adminServerService } from '@/services/admin.service.server';

export const metadata = { title: 'Analytics' };

export default async function AnalyticsPage() {
  await requireAdminPermission('analytics');
  const stats = (await adminServerService.getStats()) as AdminDashboardStats;
  const searchAnalytics = await adminServerService.getSearchAnalytics().catch(() => null);

  const chartData = [
    { label: 'Users', value: stats.totalUsers },
    { label: 'Listings', value: stats.activeListings },
    { label: 'Payments', value: stats.totalPayments },
    { label: 'Reports', value: stats.pendingReports },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">Platform and search analytics</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={chartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Search analytics</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Total searches: {(searchAnalytics as { totalSearches?: number } | null)?.totalSearches ?? 0}</p>
            <p className="mt-2">
              CTR:{' '}
              {(((searchAnalytics as { clickThroughRate?: number } | null)?.clickThroughRate ?? 0) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
