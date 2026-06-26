'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ModerationAnalytics, ModerationReportReason } from '@community-marketplace/types';
import { Card } from '@community-marketplace/ui-dashboard';
import { formatListedAgo } from '@community-marketplace/utils';

import { DashboardPageShell, DataTable } from '@/components/dashboard/async-resource';
import { StatCard } from '@/components/dashboard/stat-card';
import { adminService, type AdminServiceRole } from '@/services/admin.service';

const DAY_OPTIONS = [7, 30, 90] as const;

function formatReason(reason: ModerationReportReason): string {
  return reason.replace(/_/g, ' ');
}

function DistributionBar({ count, max }: { count: number; max: number }) {
  const width = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${width}%` }} />
      </div>
      <span className="w-8 text-right text-sm font-medium text-gray-900">{count}</span>
    </div>
  );
}

export function AdminAnalyticsPage({ role }: { role: AdminServiceRole }) {
  const [days, setDays] = useState<(typeof DAY_OPTIONS)[number]>(30);
  const [analytics, setAnalytics] = useState<ModerationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getModerationAnalytics(role, days);
      setAnalytics(data);
      if (!data) {
        setError('Could not load moderation analytics.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [role, days]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const totalActions = analytics
    ? analytics.actionStats.warnings +
      analytics.actionStats.suspensions +
      analytics.actionStats.bans +
      analytics.actionStats.deleteListings +
      analytics.actionStats.deleteMessages
    : 0;

  const totalAppeals = analytics
    ? analytics.appealOutcomes.pending +
      analytics.appealOutcomes.approved +
      analytics.appealOutcomes.rejected
    : 0;

  const maxReasonCount = analytics
    ? Math.max(...analytics.reasonDistribution.map((r) => r.count), 1)
    : 1;

  return (
    <DashboardPageShell
      title="Analytics"
      description="Moderation trends — reports, enforcement actions, and appeals."
      loading={loading}
      error={error}
      empty={!loading && !error && !analytics}
      emptyTitle="Analytics unavailable"
    >
      {analytics && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Last {days} days · updated {formatListedAgo(analytics.generatedAt)}
            </p>
            <div className="flex gap-2">
              {DAY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDays(option)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    days === option
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}d
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Enforcement actions"
              value={String(totalActions)}
            />
            <StatCard label="Warnings" value={String(analytics.actionStats.warnings)} />
            <StatCard label="Suspensions" value={String(analytics.actionStats.suspensions)} />
            <StatCard label="Bans" value={String(analytics.actionStats.bans)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Report reasons">
              {analytics.reasonDistribution.length === 0 ? (
                <p className="text-sm text-gray-500">No reports in this period.</p>
              ) : (
                <ul className="space-y-3">
                  {analytics.reasonDistribution.map((item) => (
                    <li key={item.reason}>
                      <p className="mb-1 text-sm capitalize text-gray-700">
                        {formatReason(item.reason)}
                      </p>
                      <DistributionBar count={item.count} max={maxReasonCount} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Appeal outcomes">
              {totalAppeals === 0 ? (
                <p className="text-sm text-gray-500">No appeals in this period.</p>
              ) : (
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Pending</dt>
                    <dd className="font-medium text-amber-700">{analytics.appealOutcomes.pending}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Approved</dt>
                    <dd className="font-medium text-emerald-700">{analytics.appealOutcomes.approved}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Rejected</dt>
                    <dd className="font-medium text-red-700">{analytics.appealOutcomes.rejected}</dd>
                  </div>
                </dl>
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Most reported users">
              {analytics.mostReportedUsers.length === 0 ? (
                <p className="text-sm text-gray-500">No user reports in this period.</p>
              ) : (
                <DataTable
                  columns={['User', 'Reports']}
                  rows={analytics.mostReportedUsers.map((row) => [
                    row.displayName ?? row.userId,
                    String(row.count),
                  ])}
                />
              )}
            </Card>

            <Card title="Most reported listings">
              {analytics.mostReportedListings.length === 0 ? (
                <p className="text-sm text-gray-500">No listing reports in this period.</p>
              ) : (
                <DataTable
                  columns={['Listing', 'Reports']}
                  rows={analytics.mostReportedListings.map((row) => [
                    row.title ?? row.listingId,
                    String(row.count),
                  ])}
                />
              )}
            </Card>
          </div>

          <Card title="Content removals">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="flex justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
                <dt className="text-gray-600">Listings removed</dt>
                <dd className="font-medium text-gray-900">{analytics.actionStats.deleteListings}</dd>
              </div>
              <div className="flex justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
                <dt className="text-gray-600">Messages removed</dt>
                <dd className="font-medium text-gray-900">{analytics.actionStats.deleteMessages}</dd>
              </div>
            </dl>
          </Card>
        </div>
      )}
    </DashboardPageShell>
  );
}
