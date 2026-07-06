'use client';

import Link from 'next/link';

import { cn } from '@community-marketplace/ui';
import { formatCurrency } from '@community-marketplace/utils';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import type { SuperAdminPlatformOverview } from '@/services/admin.service';
import {
  formatActivityDetail,
  formatActivityEventType,
  formatActivitySource,
} from '@/lib/super-admin-activity';

import { StatCard } from './stat-card';

type HealthStatus = SuperAdminPlatformOverview['platformHealth']['database'];

interface QuickActionItem {
  href: string;
  title: string;
  description: string;
  urgent?: boolean;
}

function GovernanceLink({
  href,
  title,
  description,
  urgent = false,
}: QuickActionItem) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-lg border bg-[hsl(var(--dashboard-main-bg))] p-4 transition-colors hover:bg-[hsl(var(--dashboard-sidebar-active)/0.3)]',
        urgent
          ? 'border-amber-300/70 bg-amber-50/40 dark:border-amber-700/50 dark:bg-amber-950/20'
          : 'border-[hsl(var(--dashboard-sidebar-border))]',
      )}
    >
      <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">{title}</p>
      <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">{description}</p>
    </Link>
  );
}

function HealthIndicator({ label, status }: { label: string; status: HealthStatus }) {
  const tone =
    status === 'healthy'
      ? 'bg-emerald-500'
      : status === 'degraded'
        ? 'bg-amber-500'
        : 'bg-red-500';

  const statusLabel =
    status === 'healthy' ? 'Healthy' : status === 'degraded' ? 'Degraded' : 'Down';

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-main-bg))] px-3 py-2">
      <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', tone)} aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">{label}</p>
        <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{statusLabel}</p>
      </div>
    </div>
  );
}


function buildQuickActions(
  stats: SuperAdminPlatformOverview,
  hasHealthIssue: boolean,
): QuickActionItem[] {
  const gov = stats.governance;
  const urgent: QuickActionItem[] = [];

  if (gov.pendingInvitations > 0) {
    urgent.push({
      href: '/super-admin/invitations',
      title: 'Pending invitations',
      description: `${gov.pendingInvitations} operator invitation${gov.pendingInvitations === 1 ? '' : 's'} awaiting acceptance.`,
      urgent: true,
    });
  }

  if (stats.pendingVerifications > 0) {
    urgent.push({
      href: '/super-admin/verifications',
      title: 'Pending verifications',
      description: `${stats.pendingVerifications} account verification${stats.pendingVerifications === 1 ? '' : 's'} need review.`,
      urgent: true,
    });
  }

  if (stats.pendingReports > 0) {
    urgent.push({
      href: '/super-admin/moderation',
      title: 'Pending reports',
      description: `${stats.pendingReports} moderation report${stats.pendingReports === 1 ? '' : 's'} in the queue.`,
      urgent: true,
    });
  }

  if (gov.openDisputes > 0) {
    urgent.push({
      href: '/super-admin/disputes',
      title: 'Open disputes',
      description: `${gov.openDisputes} marketplace dispute${gov.openDisputes === 1 ? '' : 's'} need resolution.`,
      urgent: true,
    });
  }

  if (gov.openFraudSignals > 0) {
    urgent.push({
      href: '/super-admin/fraud',
      title: 'Fraud signals',
      description: `${gov.openFraudSignals} open fraud signal${gov.openFraudSignals === 1 ? '' : 's'} to review.`,
      urgent: true,
    });
  }

  if (stats.activeBans > 0) {
    urgent.push({
      href: '/super-admin/moderation',
      title: 'Active bans',
      description: `${stats.activeBans} active user ban${stats.activeBans === 1 ? '' : 's'} on the platform.`,
      urgent: true,
    });
  }

  if (gov.pendingListingReviews > 0) {
    urgent.push({
      href: '/super-admin/listing-moderation',
      title: 'Listing moderation',
      description: `${gov.pendingListingReviews} listing${gov.pendingListingReviews === 1 ? '' : 's'} awaiting review.`,
      urgent: true,
    });
  }

  if (gov.pendingSellerVerifications > 0) {
    urgent.push({
      href: '/super-admin/seller-verification/pending',
      title: 'Seller verification',
      description: `${gov.pendingSellerVerifications} seller verification request${gov.pendingSellerVerifications === 1 ? '' : 's'} pending.`,
      urgent: true,
    });
  }

  if (stats.platformFlags.maintenanceMode) {
    urgent.push({
      href: '/super-admin/platform-settings',
      title: 'Maintenance mode',
      description: 'The platform is in maintenance mode — review before changing settings.',
      urgent: true,
    });
  }

  if (hasHealthIssue && !stats.platformFlags.maintenanceMode) {
    urgent.push({
      href: '/super-admin/platform-settings',
      title: 'Platform health',
      description: 'One or more services are degraded — review platform configuration.',
      urgent: true,
    });
  }

  const defaults: QuickActionItem[] = [
    {
      href: '/super-admin/rbac',
      title: 'Roles & permissions',
      description: 'Manage who can access each part of the platform.',
    },
    {
      href: '/super-admin/invitations',
      title: 'Invitations',
      description: 'Invite level-2 panel operators by role.',
    },
    {
      href: '/super-admin/admins',
      title: 'Admin accounts',
      description: 'Create and manage platform administrators.',
    },
    {
      href: '/super-admin/platform-settings',
      title: 'Platform settings',
      description: 'Configure maintenance mode, notifications, and security.',
    },
  ];

  if (urgent.length === 0) return defaults;

  const seen = new Set(urgent.map((item) => item.href));
  const fill = defaults.filter((item) => !seen.has(item.href));
  return [...urgent, ...fill].slice(0, 4);
}

interface SuperAdminDashboardOverviewProps {
  stats: SuperAdminPlatformOverview;
}

export function SuperAdminDashboardOverview({ stats }: SuperAdminDashboardOverviewProps) {
  const health = stats.platformHealth;
  const gov = stats.governance;
  const hasHealthIssue =
    health.database !== 'healthy' ||
    health.search !== 'healthy' ||
    health.payments !== 'healthy';

  const attentionTotal =
    stats.pendingVerifications +
    stats.pendingReports +
    stats.activeBans +
    gov.pendingInvitations +
    gov.openDisputes +
    gov.openFraudSignals +
    gov.pendingListingReviews +
    gov.pendingSellerVerifications;

  const quickActions = buildQuickActions(stats, hasHealthIssue);
  const hasUrgentActions = quickActions.some((item) => item.urgent);

  return (
    <div className="space-y-6">
      {stats.platformFlags.maintenanceMode ? (
        <div
          role="alert"
          className="rounded-lg border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-200"
        >
          Maintenance mode is <strong>enabled</strong>. Public access may be restricted.{' '}
          <Link href="/super-admin/platform-settings" className="font-medium underline">
            Review platform settings
          </Link>
        </div>
      ) : null}

      {hasHealthIssue ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200"
        >
          One or more platform services are not fully healthy. Review the status indicators below
          before making configuration changes.
        </div>
      ) : null}

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
            Platform health
          </h2>
          <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Updated {new Date(stats.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <HealthIndicator label="Database" status={health.database} />
          <HealthIndicator label="Search" status={health.search} />
          <HealthIndicator label="Payments" status={health.payments} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
          Needs attention
        </h2>
        {attentionTotal === 0 ? (
          <DashboardCard className="border-emerald-300/50 bg-emerald-50/30 dark:border-emerald-800/40 dark:bg-emerald-950/20">
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
              All clear — no queues need super-admin attention right now.
            </p>
            <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-300/80">
              Day-to-day work stays with ADMIN operators. Check back here when escalations arise.
            </p>
          </DashboardCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Pending verifications"
              value={String(stats.pendingVerifications)}
              href="/super-admin/verifications"
              needsAttention={stats.pendingVerifications > 0}
            />
            <StatCard
              label="Pending reports"
              value={String(stats.pendingReports)}
              href="/super-admin/moderation"
              needsAttention={stats.pendingReports > 0}
            />
            <StatCard
              label="Active bans"
              value={String(stats.activeBans)}
              href="/super-admin/moderation"
              needsAttention={stats.activeBans > 0}
            />
            <StatCard
              label="Pending invitations"
              value={String(gov.pendingInvitations)}
              href="/super-admin/invitations"
              needsAttention={gov.pendingInvitations > 0}
            />
            <StatCard
              label="Open disputes"
              value={String(gov.openDisputes)}
              href="/super-admin/disputes"
              needsAttention={gov.openDisputes > 0}
            />
            <StatCard
              label="Fraud signals"
              value={String(gov.openFraudSignals)}
              href="/super-admin/fraud"
              needsAttention={gov.openFraudSignals > 0}
            />
            <StatCard
              label="Listing reviews"
              value={String(gov.pendingListingReviews)}
              href="/super-admin/listing-moderation"
              needsAttention={gov.pendingListingReviews > 0}
            />
            <StatCard
              label="Seller verifications"
              value={String(gov.pendingSellerVerifications)}
              href="/super-admin/seller-verification/pending"
              needsAttention={gov.pendingSellerVerifications > 0}
            />
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
            Platform snapshot
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Total users" value={String(stats.totalUsers)} href="/super-admin/users" />
            <StatCard label="Sellers" value={String(stats.totalSellers)} href="/super-admin/users" />
            <StatCard
              label="Active listings"
              value={String(stats.activeListings)}
              href="/super-admin/listings"
            />
            <StatCard label="Revenue" value={formatCurrency(stats.revenue)} href="/super-admin/finance" />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
            Governance snapshot
          </h2>
          <DashboardCard title="Access & accountability">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
                  Active admins
                </p>
                <p className="mt-1 text-2xl font-bold text-[hsl(var(--dashboard-main-fg))]">
                  {gov.activeAdminCount}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
                  Pending invitations
                </p>
                <p
                  className={cn(
                    'mt-1 text-2xl font-bold',
                    gov.pendingInvitations > 0
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-[hsl(var(--dashboard-main-fg))]',
                  )}
                >
                  {gov.pendingInvitations}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
              {stats.roles} system roles · {stats.permissions} permissions in the RBAC catalog.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {stats.platformFlags.securityMfaRequired ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  MFA required for staff
                </span>
              ) : (
                <span className="rounded-full bg-[hsl(var(--dashboard-sidebar-active)/0.35)] px-2.5 py-1 text-xs font-medium text-[hsl(var(--dashboard-sidebar-muted))]">
                  MFA optional for staff
                </span>
              )}
              {stats.platformFlags.maintenanceMode ? (
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-900 dark:bg-red-950/40 dark:text-red-200">
                  Maintenance mode on
                </span>
              ) : null}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
                  Recent activity
                </p>
                <Link
                  href="/super-admin/audit-log"
                  className="text-xs font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
                >
                  View all
                </Link>
              </div>
              {stats.recentActivity.length === 0 ? (
                <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                  No privileged activity recorded yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {stats.recentActivity.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">
                          {formatActivityEventType(event.eventType)}
                        </p>
                        <span className="rounded-full bg-[hsl(var(--dashboard-sidebar-active)/0.35)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
                          {formatActivitySource(event.source)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                        {formatActivityDetail(event)} · {new Date(event.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </DashboardCard>
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
          {hasUrgentActions ? 'Recommended actions' : 'Quick actions'}
        </h2>
        {hasUrgentActions ? (
          <p className="mb-3 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Prioritized by open queues and platform health. Remaining governance shortcuts fill any
            open slots.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <GovernanceLink key={`${action.href}-${action.title}`} {...action} />
          ))}
        </div>
      </section>
    </div>
  );
}
