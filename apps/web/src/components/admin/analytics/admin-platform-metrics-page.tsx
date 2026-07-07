'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import type { SuperAdminPlatformOverview } from '@community-marketplace/types';
import { BarChart } from '@community-marketplace/ui';
import { DashboardCard } from '@community-marketplace/ui-dashboard';
import { formatCurrency } from '@community-marketplace/utils';

import { DashboardPageShell } from '@/components/dashboard/async-resource';
import { StatCard } from '@/components/dashboard/stat-card';
import { adminService } from '@/services/admin.service';

function healthLabel(status: SuperAdminPlatformOverview['platformHealth']['database']): string {
  if (status === 'healthy') return 'Healthy';
  if (status === 'degraded') return 'Degraded';
  return 'Down';
}

export function AdminPlatformMetricsPage() {
  const [stats, setStats] = useState<SuperAdminPlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getPlatformOverview();
      setStats(data);
      if (!data) {
        setError('Could not load platform metrics.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platform metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const marketplaceData = stats
    ? [
        { label: 'Users', value: stats.totalUsers },
        { label: 'Sellers', value: stats.totalSellers },
        { label: 'Buyers', value: stats.totalBuyers },
        { label: 'Listings', value: stats.activeListings },
      ]
    : [];

  const operationalData = stats
    ? [
        { label: 'Verifications', value: stats.pendingVerifications },
        { label: 'Reports', value: stats.pendingReports },
        { label: 'Bans', value: stats.activeBans },
      ]
    : [];

  return (
    <DashboardPageShell
      title="Platform metrics"
      description="Marketplace scale, operational queues, and service health."
      loading={loading}
      error={error}
      empty={!loading && !error && !stats}
      emptyTitle="Platform metrics unavailable"
    >
      {stats ? (
        <div className="space-y-6">
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Snapshot as of {new Date(stats.generatedAt).toLocaleString()}
          </p>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
              Marketplace scale
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total users" value={String(stats.totalUsers)} />
              <StatCard label="Sellers" value={String(stats.totalSellers)} />
              <StatCard label="Buyers" value={String(stats.totalBuyers)} />
              <StatCard label="Active listings" value={String(stats.activeListings)} />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardCard title="User & listing mix">
              <BarChart data={marketplaceData} />
            </DashboardCard>
            <DashboardCard title="Operational queue">
              <BarChart data={operationalData} />
              <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                Items awaiting review across accounts and trust workflows.
              </p>
            </DashboardCard>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
              Commerce & services
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total payments" value={String(stats.totalPayments)} href="/super-admin/finance" />
              <StatCard label="Revenue" value={formatCurrency(stats.revenue)} href="/super-admin/finance" />
              <StatCard
                label="Database"
                value={healthLabel(stats.platformHealth.database)}
              />
              <StatCard
                label="Search"
                value={healthLabel(stats.platformHealth.search)}
                href="/super-admin/search"
              />
            </div>
          </section>

          <DashboardCard title="Related insight">
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/super-admin/moderation-insights"
                className="font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
              >
                Moderation insights
              </Link>
              <Link
                href="/super-admin/search"
                className="font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
              >
                Search health & query insights
              </Link>
              <Link
                href="/super-admin/finance"
                className="font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
              >
                Financial reports
              </Link>
            </div>
          </DashboardCard>
        </div>
      ) : null}
    </DashboardPageShell>
  );
}
