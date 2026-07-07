'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

import { cn } from '@community-marketplace/ui';
import { usePageTitle } from '@community-marketplace/ui-dashboard';

import { SuperAdminDashboardOverview } from '@/components/dashboard/super-admin-dashboard-overview';
import { adminService, type SuperAdminPlatformOverview } from '@/services/admin.service';

const REFRESH_INTERVAL_MS = 60_000;

interface SuperAdminDashboardHomeProps {
  title: string;
  description: string;
}

function OverviewSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div className="col-span-full h-28 rounded-xl bg-[hsl(var(--dashboard-sidebar-border)/0.35)]" />
      <div className="col-span-full h-36 rounded-xl bg-[hsl(var(--dashboard-sidebar-border)/0.35)] xl:col-span-1" />
      <div className="col-span-full h-56 rounded-xl bg-[hsl(var(--dashboard-sidebar-border)/0.35)] xl:col-span-2" />
      <div className="col-span-full h-4 w-28 rounded bg-[hsl(var(--dashboard-sidebar-border)/0.35)]" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`action-${index}`}
          className="col-span-full h-16 rounded-xl bg-[hsl(var(--dashboard-sidebar-border)/0.35)] sm:col-span-1 xl:col-span-1"
        />
      ))}
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
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[hsl(var(--dashboard-sidebar-border))] pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[hsl(var(--dashboard-main-fg))]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[hsl(var(--dashboard-sidebar-muted))]">
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void loadOverview(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] px-3 py-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] shadow-sm transition-all hover:border-[hsl(var(--dashboard-accent)/0.35)] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.25)] hover:shadow disabled:opacity-60"
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
