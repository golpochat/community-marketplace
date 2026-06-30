'use client';

import Link from 'next/link';

import { formatCurrency } from '@community-marketplace/utils';
import { BarChart } from '@community-marketplace/ui';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import type { SuperAdminPlatformOverview } from '@/services/admin.service';

import { StatCard } from './stat-card';

interface SuperAdminDashboardOverviewProps {
  stats: SuperAdminPlatformOverview;
}

export function SuperAdminDashboardOverview({ stats }: SuperAdminDashboardOverviewProps) {
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
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
          Platform scale
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Users" value={String(stats.totalUsers)} />
          <StatCard label="Sellers" value={String(stats.totalSellers)} />
          <StatCard label="Active Listings" value={String(stats.activeListings)} />
          <StatCard label="Revenue" value={formatCurrency(stats.revenue)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
          Governance
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Platform roles" value={String(stats.roles)} />
          <StatCard label="Permissions" value={String(stats.permissions)} />
          <StatCard label="Pending Verifications" value={String(stats.pendingVerifications)} />
          <StatCard label="Active Bans" value={String(stats.activeBans)} />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Payments" value={String(stats.totalPayments)} />
        <StatCard label="Pending Reports" value={String(stats.pendingReports)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="User distribution">
          <BarChart data={userData} />
        </DashboardCard>
        <DashboardCard title="Platform health">
          <BarChart data={healthData} />
          <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Updated {new Date(stats.generatedAt).toLocaleString()}
          </p>
        </DashboardCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/super-admin/rbac"
          className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-main-bg))] p-4 transition-colors hover:bg-[hsl(var(--dashboard-sidebar-active)/0.3)]"
        >
          <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">Roles & permissions</p>
          <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Manage who can access each part of the platform.
          </p>
        </Link>
        <Link
          href="/super-admin/invitations"
          className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-main-bg))] p-4 transition-colors hover:bg-[hsl(var(--dashboard-sidebar-active)/0.3)]"
        >
          <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">Invitations</p>
          <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Invite level-2 panel operators by role.
          </p>
        </Link>
        <Link
          href="/super-admin/admins"
          className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-main-bg))] p-4 transition-colors hover:bg-[hsl(var(--dashboard-sidebar-active)/0.3)]"
        >
          <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">Admin accounts</p>
          <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Create and manage platform administrators.
          </p>
        </Link>
        <Link
          href="/super-admin/platform-settings"
          className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-main-bg))] p-4 transition-colors hover:bg-[hsl(var(--dashboard-sidebar-active)/0.3)]"
        >
          <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">Platform settings</p>
          <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Configure maintenance mode, notifications, and security.
          </p>
        </Link>
      </div>
    </div>
  );
}
