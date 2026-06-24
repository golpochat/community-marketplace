'use client';

import { useEffect, useState } from 'react';

import type { AdminDashboardStats } from '@community-marketplace/types';
import { PageHeader } from '@community-marketplace/ui-dashboard';

import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { adminService, type AdminServiceRole } from '@/services/admin.service';

interface AdminDashboardHomeProps {
  role: AdminServiceRole;
  title: string;
  description: string;
}

export function AdminDashboardHome({ role, title, description }: AdminDashboardHomeProps) {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void adminService
      .getStats(role)
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
  }, [role]);

  return (
    <>
      <PageHeader title={title} description={description} />
      {loading && (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading platform metrics…</p>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {stats && !loading && <DashboardOverview stats={stats} />}
    </>
  );
}
