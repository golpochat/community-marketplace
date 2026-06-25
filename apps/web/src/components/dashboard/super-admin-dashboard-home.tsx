'use client';

import { useEffect, useState } from 'react';

import { PageHeader } from '@community-marketplace/ui-dashboard';

import { SuperAdminDashboardOverview } from '@/components/dashboard/super-admin-dashboard-overview';
import { adminService, type SuperAdminPlatformOverview } from '@/services/admin.service';

interface SuperAdminDashboardHomeProps {
  title: string;
  description: string;
}

export function SuperAdminDashboardHome({ title, description }: SuperAdminDashboardHomeProps) {
  const [stats, setStats] = useState<SuperAdminPlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void adminService
      .getPlatformOverview()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader title={title} description={description} />
      {loading && (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading platform metrics…</p>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {stats && !loading && <SuperAdminDashboardOverview stats={stats} />}
    </>
  );
}
