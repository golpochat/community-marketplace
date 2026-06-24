'use client';

import type { AdminDashboardStats } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { BarChart, Card, CardContent, CardHeader, CardTitle } from '@community-marketplace/ui';

import { StatCard } from '@/components/dashboard/stat-card';

interface Props {
  stats: AdminDashboardStats;
}

export function DashboardOverview({ stats }: Props) {
  const healthData = [
    { label: 'DB', value: stats.platformHealth.database === 'healthy' ? 100 : 40 },
    { label: 'Search', value: stats.platformHealth.search === 'healthy' ? 100 : 40 },
    { label: 'Pay', value: stats.platformHealth.payments === 'healthy' ? 100 : 40 },
  ];

  const userData = [
    { label: 'Buyers', value: stats.totalBuyers },
    { label: 'Sellers', value: stats.totalSellers },
    { label: 'Total', value: stats.totalUsers },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={String(stats.totalUsers)} />
        <StatCard label="Sellers" value={String(stats.totalSellers)} />
        <StatCard label="Active Listings" value={String(stats.activeListings)} />
        <StatCard label="Revenue" value={formatCurrency(stats.revenue)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Payments" value={String(stats.totalPayments)} />
        <StatCard label="Pending Verifications" value={String(stats.pendingVerifications)} />
        <StatCard label="Pending Reports" value={String(stats.pendingReports)} />
        <StatCard label="Active Bans" value={String(stats.activeBans)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={userData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Platform health</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={healthData} />
            <p className="mt-2 text-xs text-muted-foreground">
              Updated {new Date(stats.generatedAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
