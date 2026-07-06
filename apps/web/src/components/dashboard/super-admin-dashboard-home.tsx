'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

import { cn } from '@community-marketplace/ui';
import { DashboardCard, usePageTitle } from '@community-marketplace/ui-dashboard';

import { SuperAdminDashboardOverview } from '@/components/dashboard/super-admin-dashboard-overview';
import { adminService, type SuperAdminPlatformOverview } from '@/services/admin.service';

const REFRESH_INTERVAL_MS = 60_000;

interface SuperAdminDashboardHomeProps {
  title: string;
  description: string;
}

function OverviewSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`health-${index}`}
            className="h-14 rounded-lg bg-[hsl(var(--dashboard-sidebar-border)/0.35)]"
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <DashboardCard key={`attention-${index}`}>
            <div className="h-4 w-28 rounded bg-[hsl(var(--dashboard-sidebar-border)/0.35)]" />
            <div className="mt-3 h-8 w-16 rounded bg-[hsl(var(--dashboard-sidebar-border)/0.35)]" />
          </DashboardCard>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <DashboardCard key={`snapshot-${index}`}>
              <div className="h-4 w-24 rounded bg-[hsl(var(--dashboard-sidebar-border)/0.35)]" />
              <div className="mt-3 h-8 w-12 rounded bg-[hsl(var(--dashboard-sidebar-border)/0.35)]" />
            </DashboardCard>
          ))}
        </div>
        <DashboardCard title="Access & accountability">
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={`gov-metric-${index}`}>
                <div className="h-3 w-24 rounded bg-[hsl(var(--dashboard-sidebar-border)/0.35)]" />
                <div className="mt-2 h-8 w-12 rounded bg-[hsl(var(--dashboard-sidebar-border)/0.35)]" />
              </div>
            ))}
          </div>
          <div className="mt-4 h-4 w-full rounded bg-[hsl(var(--dashboard-sidebar-border)/0.35)]" />
          <div className="mt-5 space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`audit-${index}`}
                className="h-12 rounded-lg bg-[hsl(var(--dashboard-sidebar-border)/0.35)]"
              />
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

export function SuperAdminDashboardHome({ title, description }: SuperAdminDashboardHomeProps) {
  const { setTitle } = usePageTitle();
  const [stats, setStats] = useState<SuperAdminPlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await adminService.getPlatformOverview();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platform metrics');
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadOverview(true);
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [loadOverview]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--dashboard-main-fg))]">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void loadOverview(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] px-3 py-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] transition-colors hover:bg-[hsl(var(--dashboard-sidebar-active)/0.3)] disabled:opacity-60"
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {loading && <OverviewSkeleton />}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {stats && !loading && <SuperAdminDashboardOverview stats={stats} />}
    </>
  );
}
