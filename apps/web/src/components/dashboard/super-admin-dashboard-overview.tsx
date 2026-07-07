'use client';

import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Shield,
  Sparkles,
} from 'lucide-react';

import { cn } from '@community-marketplace/ui';
import { formatCurrency } from '@community-marketplace/utils';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import type { SuperAdminPlatformOverview } from '@/services/admin.service';
import {
  formatActivityDetail,
  formatActivityEventType,
  formatActivitySource,
} from '@/lib/super-admin-activity';

type HealthStatus = SuperAdminPlatformOverview['platformHealth']['database'];

interface QuickActionItem {
  href: string;
  title: string;
  description: string;
  urgent?: boolean;
}

function SectionLabel({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-3.5 w-0.5 shrink-0 rounded-full bg-[hsl(var(--dashboard-accent))]"
        aria-hidden
      />
      {Icon ? (
        <Icon className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--dashboard-accent))]" aria-hidden />
      ) : null}
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--dashboard-sidebar-muted))]">
        {children}
      </p>
    </div>
  );
}

function OverviewCard({
  children,
  className,
  accent = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  accent?: 'default' | 'health' | 'platform' | 'governance';
}) {
  const accentBar =
    accent === 'health'
      ? 'from-emerald-500/80 via-[hsl(var(--dashboard-accent))] to-[hsl(var(--dashboard-accent)/0.4)]'
      : accent === 'platform'
        ? 'from-[hsl(var(--dashboard-accent))] to-[hsl(var(--dashboard-accent)/0.35)]'
        : accent === 'governance'
          ? 'from-violet-500/70 to-[hsl(var(--dashboard-accent)/0.35)]'
          : 'from-[hsl(var(--dashboard-sidebar-border))] to-transparent';

  return (
    <DashboardCard
      className={cn(
        'relative h-full overflow-hidden border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] p-4 shadow-sm ring-1 ring-black/[0.02] dark:ring-white/[0.03]',
        className,
      )}
    >
      <div
        className={cn('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r', accentBar)}
        aria-hidden
      />
      {children}
    </DashboardCard>
  );
}

function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'warning' | 'danger';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium',
        tone === 'warning' &&
          'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/50',
        tone === 'danger' &&
          'bg-red-100 text-red-900 ring-1 ring-red-200/80 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-800/50',
        tone === 'neutral' &&
          'bg-[hsl(var(--dashboard-sidebar-active)/0.35)] text-[hsl(var(--dashboard-sidebar-muted))] ring-1 ring-[hsl(var(--dashboard-sidebar-border))]',
      )}
    >
      {children}
    </span>
  );
}

function CompactMetric({
  label,
  value,
  href,
  highlight = false,
}: {
  label: string;
  value: string;
  href?: string;
  highlight?: boolean;
}) {
  const body = (
    <div
      className={cn(
        'rounded-lg px-2.5 py-2 transition-colors',
        highlight
          ? 'bg-amber-50/80 ring-1 ring-amber-200/70 dark:bg-amber-950/25 dark:ring-amber-800/40'
          : 'bg-[hsl(var(--dashboard-sidebar-active)/0.14)] ring-1 ring-[hsl(var(--dashboard-sidebar-border)/0.65)]',
        href && 'group-hover:bg-[hsl(var(--dashboard-sidebar-active)/0.28)] group-hover:ring-[hsl(var(--dashboard-accent)/0.25)]',
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 text-lg font-semibold leading-tight tabular-nums',
          highlight
            ? 'text-amber-700 dark:text-amber-400'
            : 'text-[hsl(var(--dashboard-main-fg))]',
        )}
      >
        {value}
      </p>
    </div>
  );

  if (!href) {
    return body;
  }

  return (
    <Link href={href} className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--dashboard-accent))]">
      {body}
    </Link>
  );
}

function GovernanceLink({ href, title, description, urgent = false }: QuickActionItem) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex h-full min-h-[4.5rem] flex-col justify-between rounded-xl border px-3.5 py-3 shadow-sm transition-all',
        'hover:-translate-y-px hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--dashboard-accent))]',
        urgent
          ? 'border-amber-300/80 bg-gradient-to-br from-amber-50/90 to-[hsl(var(--dashboard-topbar-bg))] dark:border-amber-700/50 dark:from-amber-950/30 dark:to-[hsl(var(--dashboard-topbar-bg))]'
          : 'border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-main-bg))] hover:border-[hsl(var(--dashboard-accent)/0.35)]',
      )}
    >
      <div>
        <p className="text-sm font-semibold text-[hsl(var(--dashboard-main-fg))]">{title}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[hsl(var(--dashboard-sidebar-muted))]">
          {description}
        </p>
      </div>
      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(var(--dashboard-accent))] opacity-0 transition-opacity group-hover:opacity-100">
        Open
        <ArrowUpRight className="h-3 w-3" aria-hidden />
      </span>
    </Link>
  );
}

function HealthPill({ label, status, href }: { label: string; status: HealthStatus; href?: string }) {
  const tone =
    status === 'healthy'
      ? {
          dot: 'bg-emerald-500 shadow-[0_0_0_3px_hsl(152_76%_40%/0.15)]',
          shell:
            'border-emerald-200/80 bg-emerald-50/60 hover:border-emerald-300 dark:border-emerald-900/50 dark:bg-emerald-950/25',
          status: 'text-emerald-700 dark:text-emerald-400',
        }
      : status === 'degraded'
        ? {
            dot: 'bg-amber-500 shadow-[0_0_0_3px_hsl(38_92%_50%/0.15)]',
            shell:
              'border-amber-200/80 bg-amber-50/60 hover:border-amber-300 dark:border-amber-900/50 dark:bg-amber-950/25',
            status: 'text-amber-700 dark:text-amber-400',
          }
        : {
            dot: 'bg-red-500 shadow-[0_0_0_3px_hsl(0_84%_60%/0.15)]',
            shell:
              'border-red-200/80 bg-red-50/60 hover:border-red-300 dark:border-red-900/50 dark:bg-red-950/25',
            status: 'text-red-700 dark:text-red-400',
          };

  const statusLabel =
    status === 'healthy' ? 'Healthy' : status === 'degraded' ? 'Degraded' : 'Down';

  const content = (
    <span className="inline-flex items-center gap-2 text-xs text-[hsl(var(--dashboard-main-fg))]">
      <span className={cn('h-2 w-2 shrink-0 rounded-full', tone.dot)} aria-hidden />
      <span className="font-semibold">{label}</span>
      <span className={cn('font-medium', tone.status)}>{statusLabel}</span>
    </span>
  );

  const shellClass = cn(
    'inline-flex rounded-lg border px-2.5 py-1.5 transition-colors',
    tone.shell,
  );

  if (href) {
    return (
      <Link href={href} className={shellClass}>
        {content}
      </Link>
    );
  }

  return <span className={shellClass}>{content}</span>;
}

function buildQuickActions(
  stats: SuperAdminPlatformOverview,
  hasHealthIssue: boolean,
): QuickActionItem[] {
  const gov = stats.governance;
  const urgent: QuickActionItem[] = [];

  if (gov.pendingInvitations > 0) {
    urgent.push({
      href: '/super-admin/user-management?tab=invitations',
      title: 'Pending invitations',
      description: `${gov.pendingInvitations} invitation${gov.pendingInvitations === 1 ? '' : 's'} awaiting acceptance.`,
      urgent: true,
    });
  }

  if (gov.openDisputes > 0) {
    urgent.push({
      href: '/super-admin/disputes',
      title: 'Open disputes',
      description: `${gov.openDisputes} dispute${gov.openDisputes === 1 ? '' : 's'} need resolution.`,
      urgent: true,
    });
  }

  if (gov.openFraudSignals > 0) {
    urgent.push({
      href: '/super-admin/fraud',
      title: 'Fraud signals',
      description: `${gov.openFraudSignals} open signal${gov.openFraudSignals === 1 ? '' : 's'} to review.`,
      urgent: true,
    });
  }

  if (stats.platformFlags.maintenanceMode) {
    urgent.push({
      href: '/super-admin/platform-settings',
      title: 'Maintenance mode',
      description: 'Public access may be restricted.',
      urgent: true,
    });
  }

  if (hasHealthIssue && !stats.platformFlags.maintenanceMode) {
    urgent.push({
      href: '/super-admin/platform-settings',
      title: 'Platform health',
      description: 'One or more services are degraded.',
      urgent: true,
    });
  }

  const defaults: QuickActionItem[] = [
    {
      href: '/super-admin/rbac',
      title: 'Roles & permissions',
      description: 'Access control for the platform.',
    },
    {
      href: '/super-admin/user-management',
      title: 'User management',
      description: 'Admins and invitations.',
    },
    {
      href: '/super-admin/platform-settings',
      title: 'Platform settings',
      description: 'Maintenance, security, notifications.',
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

  const attentionTotal = gov.pendingInvitations + gov.openDisputes + gov.openFraudSignals;
  const quickActions = buildQuickActions(stats, hasHealthIssue);
  const hasUrgentActions = quickActions.some((item) => item.urgent);
  const recentActivity = stats.recentActivity.slice(0, 4);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.platformFlags.maintenanceMode ? (
        <div
          role="alert"
          className="col-span-full flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-gradient-to-r from-red-50 to-[hsl(var(--dashboard-topbar-bg))] px-3.5 py-2.5 text-xs text-red-900 dark:border-red-800/50 dark:from-red-950/30 dark:to-[hsl(var(--dashboard-topbar-bg))] dark:text-red-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
          <p>
            Maintenance mode is <strong>enabled</strong>.{' '}
            <Link href="/super-admin/platform-settings" className="font-semibold text-red-800 underline underline-offset-2 dark:text-red-300">
              Review settings
            </Link>
          </p>
        </div>
      ) : null}

      {hasHealthIssue ? (
        <div
          role="alert"
          className="col-span-full flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-[hsl(var(--dashboard-topbar-bg))] px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-700/50 dark:from-amber-950/30 dark:to-[hsl(var(--dashboard-topbar-bg))] dark:text-amber-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <p>
            One or more platform services are not fully healthy. Check status below before changing
            configuration.
          </p>
        </div>
      ) : null}

      <OverviewCard className="col-span-full" accent="health">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <SectionLabel icon={Activity}>Platform health</SectionLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              <HealthPill label="Database" status={health.database} />
              <HealthPill label="Search" status={health.search} href="/super-admin/search" />
              <HealthPill label="Payments" status={health.payments} />
            </div>
          </div>
          <p className="shrink-0 rounded-md bg-[hsl(var(--dashboard-sidebar-active)/0.2)] px-2 py-1 text-[11px] text-[hsl(var(--dashboard-sidebar-muted))] sm:text-right">
            Updated {new Date(stats.generatedAt).toLocaleString()}
          </p>
        </div>

        <div className="mt-3 border-t border-dashed border-[hsl(var(--dashboard-sidebar-border))] pt-3">
          <SectionLabel>Needs attention</SectionLabel>
          {attentionTotal === 0 ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-50/80 px-2.5 py-1.5 ring-1 ring-emerald-200/70 dark:bg-emerald-950/20 dark:ring-emerald-900/50">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <p className="text-xs text-emerald-900 dark:text-emerald-200">
                <span className="font-semibold">All clear</span>
                <span className="text-emerald-800/80 dark:text-emerald-300/80">
                  {' '}
                  — no governance escalations right now.
                </span>
              </p>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-1 gap-2 min-[480px]:grid-cols-3 sm:grid-cols-3">
              <CompactMetric
                label="Invitations"
                value={String(gov.pendingInvitations)}
                href="/super-admin/user-management?tab=invitations"
                highlight={gov.pendingInvitations > 0}
              />
              <CompactMetric
                label="Disputes"
                value={String(gov.openDisputes)}
                href="/super-admin/disputes"
                highlight={gov.openDisputes > 0}
              />
              <CompactMetric
                label="Fraud"
                value={String(gov.openFraudSignals)}
                href="/super-admin/fraud"
                highlight={gov.openFraudSignals > 0}
              />
            </div>
          )}
        </div>
      </OverviewCard>

      <OverviewCard className="col-span-full xl:col-span-1" accent="platform">
        <SectionLabel icon={Sparkles}>Platform snapshot</SectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <CompactMetric
            label="Total users"
            value={String(stats.totalUsers)}
            href="/super-admin/platform-metrics"
          />
          <CompactMetric
            label="Sellers"
            value={String(stats.totalSellers)}
            href="/super-admin/platform-metrics"
          />
          <CompactMetric
            label="Active listings"
            value={String(stats.activeListings)}
            href="/super-admin/platform-metrics"
          />
          <CompactMetric
            label="Revenue"
            value={formatCurrency(stats.revenue)}
            href="/super-admin/finance"
          />
        </div>
      </OverviewCard>

      <OverviewCard className="col-span-full xl:col-span-2" accent="governance">
        <SectionLabel icon={Shield}>Governance</SectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <CompactMetric
            label="Operators"
            value={String(gov.activeAdminCount)}
            href="/super-admin/user-management"
          />
          <CompactMetric
            label="Invitations"
            value={String(gov.pendingInvitations)}
            href="/super-admin/user-management?tab=invitations"
            highlight={gov.pendingInvitations > 0}
          />
          <CompactMetric label="Roles" value={String(stats.roles)} href="/super-admin/rbac" />
          <CompactMetric label="Permissions" value={String(stats.permissions)} href="/super-admin/rbac" />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {stats.platformFlags.securityMfaRequired ? (
            <StatusBadge tone="warning">MFA required</StatusBadge>
          ) : (
            <StatusBadge tone="neutral">MFA optional</StatusBadge>
          )}
          {stats.platformFlags.maintenanceMode ? (
            <StatusBadge tone="danger">Maintenance on</StatusBadge>
          ) : null}
        </div>

        <div className="mt-3 border-t border-dashed border-[hsl(var(--dashboard-sidebar-border))] pt-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <SectionLabel>Recent activity</SectionLabel>
            <Link
              href="/super-admin/audit-log"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[hsl(var(--dashboard-accent))] transition-colors hover:text-[hsl(var(--dashboard-accent)/0.8)]"
            >
              View all
              <ArrowUpRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="rounded-lg bg-[hsl(var(--dashboard-sidebar-active)/0.12)] px-3 py-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              No privileged activity recorded yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {recentActivity.map((event) => (
                <li
                  key={event.id}
                  className="rounded-lg px-2.5 py-2 text-xs transition-colors hover:bg-[hsl(var(--dashboard-sidebar-active)/0.18)]"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
                    <span className="font-semibold text-[hsl(var(--dashboard-main-fg))]">
                      {formatActivityEventType(event)}
                    </span>
                    <span className="inline-flex w-fit rounded-md bg-[hsl(var(--dashboard-accent)/0.1)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-accent))]">
                      {formatActivitySource(event.source)}
                    </span>
                    <span className="text-[11px] text-[hsl(var(--dashboard-sidebar-muted))] sm:ml-auto">
                      {new Date(event.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[hsl(var(--dashboard-sidebar-muted))] sm:line-clamp-1">
                    {formatActivityDetail(event)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </OverviewCard>

      <div className="col-span-full border-t border-[hsl(var(--dashboard-sidebar-border))] pt-1">
        <SectionLabel>{hasUrgentActions ? 'Recommended actions' : 'Quick actions'}</SectionLabel>
      </div>

      {quickActions.map((action) => (
        <div key={`${action.href}-${action.title}`} className="col-span-full sm:col-span-1 xl:col-span-1">
          <GovernanceLink {...action} />
        </div>
      ))}
    </div>
  );
}
