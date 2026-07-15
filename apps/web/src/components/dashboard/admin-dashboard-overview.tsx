'use client';

import type { AdminDashboardStats } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { BarChart } from '@community-marketplace/ui';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import { StatCard } from './stat-card';

interface AdminDashboardOverviewProps {
  stats: AdminDashboardStats;
}

export function AdminDashboardOverview({ stats }: AdminDashboardOverviewProps) {
  const operationalData = [
    { label: 'Verifications', value: stats.pendingVerifications },
    { label: 'Reports', value: stats.pendingReports },
    { label: 'Bans', value: stats.activeBans },
  ];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
          Needs attention
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Pending Verifications" value={String(stats.pendingVerifications)} />
          <StatCard
            label="Fast-track pending"
            value={String(stats.pendingFastTrackVerifications ?? 0)}
          />
          <StatCard
            label="Fast-track overdue"
            value={String(stats.overdueFastTrackVerifications ?? 0)}
          />
          <StatCard label="Pending Reports" value={String(stats.pendingReports)} />
          <StatCard label="Active Bans" value={String(stats.activeBans)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
          Marketplace activity
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Users" value={String(stats.totalUsers)} />
          <StatCard label="Sellers" value={String(stats.totalSellers)} />
          <StatCard label="Active Listings" value={String(stats.activeListings)} />
          <StatCard label="Payments" value={String(stats.totalPayments)} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Operational queue">
          <BarChart data={operationalData} />
          <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Items in your admin workflow requiring review or action.
          </p>
        </DashboardCard>
        <DashboardCard title="Revenue snapshot">
          <p className="text-3xl font-bold text-[hsl(var(--dashboard-main-fg))]">
            {formatCurrency(stats.revenue)}
          </p>
          <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Total succeeded payments · updated {new Date(stats.generatedAt).toLocaleString()}
          </p>
        </DashboardCard>
      </div>
    </div>
  );
}
