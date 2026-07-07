'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';

import type {
  ReindexJobStatus,
  SearchAnalyticsSummary,
  SearchHealthResponse,
  SearchIndexMeta,
  SearchIndexName,
} from '@community-marketplace/types';
import { Button, Card } from '@community-marketplace/ui-dashboard';
import { formatListedAgo } from '@community-marketplace/utils';

import { DashboardPageShell, DataTable } from '@/components/dashboard/async-resource';
import { DashboardSectionTabs } from '@/components/dashboard/dashboard-section-tabs';
import { StatCard } from '@/components/dashboard/stat-card';
import { adminService, type AdminServiceRole } from '@/services/admin.service';

const INDEX_LABELS: Record<SearchIndexName, string> = {
  listings: 'Listings',
  users: 'Users',
  categories: 'Categories',
  chat_threads: 'Chat threads',
};

type SearchTabId = 'overview' | 'query-insights';

function EngineStatusBadge({ healthy }: { healthy: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        healthy ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
      }`}
    >
      {healthy ? 'Healthy' : 'Unavailable'}
    </span>
  );
}

function SyncStatusBadge({ status }: { status: SearchIndexMeta['syncStatus'] }) {
  const label =
    status === 'synced'
      ? 'Synced'
      : status === 'empty'
        ? 'Empty index'
        : status === 'stale'
          ? 'Out of sync'
          : 'Offline';

  const className =
    status === 'synced'
      ? 'bg-emerald-50 text-emerald-800'
      : status === 'offline'
        ? 'bg-red-50 text-red-800'
        : 'bg-amber-50 text-amber-900';

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function formatIndexUpdated(index: SearchIndexMeta): string {
  if (index.lastSyncedAt) {
    return `Reindexed ${formatListedAgo(index.lastSyncedAt)}`;
  }
  if (index.statsUpdatedAt) {
    return `Checked ${formatListedAgo(index.statsUpdatedAt)}`;
  }
  return 'Not available';
}

function formatDocumentCounts(index: SearchIndexMeta): string {
  const expected = index.expectedDocumentCount;
  if (expected === undefined) return String(index.documentCount);
  return `${index.documentCount} / ${expected}`;
}

function confirmReindex(target: string): boolean {
  return window.confirm(
    `Reindex ${target}? Search results may be incomplete until indexing finishes.`,
  );
}

function SearchAnalyticsPanel({
  analytics,
  loading,
  error,
}: {
  analytics: SearchAnalyticsSummary | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading analytics…</p>;
  }
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (!analytics) {
    return (
      <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
        Search analytics are not available yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Searches (30 days)" value={String(analytics.totalSearches)} />
        <StatCard
          label="Click-through rate"
          value={`${Math.round(analytics.clickThroughRate * 100)}%`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Popular queries">
          {analytics.popularKeywords.length === 0 ? (
            <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No searches recorded yet.</p>
          ) : (
            <DataTable
              columns={['Query', 'Searches']}
              rows={analytics.popularKeywords.slice(0, 10).map((row) => [row.query, String(row.count)])}
            />
          )}
        </Card>

        <Card title="Zero-result queries">
          {analytics.zeroResultQueries.length === 0 ? (
            <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No zero-result queries.</p>
          ) : (
            <DataTable
              columns={['Query', 'Times']}
              rows={analytics.zeroResultQueries.slice(0, 10).map((row) => [row.query, String(row.count)])}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

export function AdminSearchPage({ role }: { role: AdminServiceRole }) {
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const canReindex = !isSuperAdmin;
  const showDevSetup = process.env.NODE_ENV === 'development';

  const [activeTab, setActiveTab] = useState<SearchTabId>('overview');
  const [health, setHealth] = useState<SearchHealthResponse | null>(null);
  const [analytics, setAnalytics] = useState<SearchAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [reindexing, setReindexing] = useState<SearchIndexName | 'all' | null>(null);
  const [jobStatuses, setJobStatuses] = useState<Partial<Record<SearchIndexName, ReindexJobStatus>>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getSearchHealth(role);
      setHealth(data);
      if (!data) {
        setError('Could not load search health.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load search health');
    } finally {
      setLoading(false);
    }
  }, [role]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await adminService.getSearchAnalytics(role);
      setAnalytics(data);
      if (!data) {
        setAnalyticsError('Could not load search analytics.');
      }
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : 'Failed to load search analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  useEffect(() => {
    if (activeTab === 'query-insights') {
      void loadAnalytics();
    }
  }, [activeTab, loadAnalytics]);

  async function pollReindexStatus(type: SearchIndexName) {
    for (let i = 0; i < 30; i += 1) {
      await new Promise((r) => setTimeout(r, 1000));
      const status = await adminService.getSearchReindexStatus(role, type);
      if (!status) continue;
      setJobStatuses((prev) => ({ ...prev, [type]: status }));
      if (status.status === 'completed' || status.status === 'failed') {
        await loadHealth();
        return;
      }
    }
  }

  async function handleReindex(type: SearchIndexName) {
    const label = INDEX_LABELS[type] ?? type;
    if (!confirmReindex(label)) return;

    setReindexing(type);
    setActionError(null);
    try {
      const status = await adminService.triggerSearchReindex(role, type);
      setJobStatuses((prev) => ({ ...prev, [type]: status }));
      await pollReindexStatus(type);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Reindex failed');
    } finally {
      setReindexing(null);
    }
  }

  async function handleReindexAll() {
    if (!confirmReindex('all indexes')) return;

    setReindexing('all');
    setActionError(null);
    const types: SearchIndexName[] = ['listings', 'users', 'categories', 'chat_threads'];
    try {
      for (const type of types) {
        const status = await adminService.triggerSearchReindex(role, type);
        setJobStatuses((prev) => ({ ...prev, [type]: status }));
      }
      await Promise.all(types.map((type) => pollReindexStatus(type)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Reindex failed');
    } finally {
      setReindexing(null);
    }
  }

  const indexes = health?.indexes ?? [];
  const totalDocuments = indexes.reduce((sum, idx) => sum + idx.documentCount, 0);
  const healthyIndexes = indexes.filter((idx) => idx.syncStatus === 'synced').length;
  const attentionIndexes = indexes.filter(
    (idx) => idx.syncStatus === 'empty' || idx.syncStatus === 'stale',
  ).length;

  const tabs = [
    { id: 'overview', label: isSuperAdmin ? 'Overview' : 'Health & reindex' },
    { id: 'query-insights', label: 'Query insights' },
  ];

  return (
    <DashboardPageShell
      title={isSuperAdmin ? 'Search' : 'Search Tools'}
      description={
        isSuperAdmin
          ? 'Search engine health and query insights. Reindex controls live on the admin panel.'
          : 'Meilisearch health, reindex controls, and query insights.'
      }
      loading={loading && activeTab === 'overview'}
      error={activeTab === 'overview' ? error : null}
      empty={activeTab === 'overview' && !loading && !error && !health}
      emptyTitle="Search health unavailable"
    >
      <DashboardSectionTabs items={tabs} activeId={activeTab} onChange={(id) => setActiveTab(id as SearchTabId)} />

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Engine" value={health?.healthy ? 'Online' : 'Offline'} />
            <StatCard label="Synced indexes" value={`${healthyIndexes} / ${indexes.length}`} />
            <StatCard label="Indexed documents" value={String(totalDocuments)} />
            <StatCard
              label="Search mode"
              value={health?.mode === 'meilisearch' ? 'Meilisearch' : 'Database fallback'}
            />
          </div>

          {attentionIndexes > 0 && health?.healthy ? (
            <Card title="Indexes need attention">
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                {attentionIndexes} index{attentionIndexes === 1 ? '' : 'es'} look empty or out of sync with the
                database.
                {canReindex ? ' Run a reindex from this page.' : ' Ask an operations admin to reindex.'}
              </p>
            </Card>
          ) : null}

          {showDevSetup && !health?.healthy ? (
            <Card title="Meilisearch is not running">
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                Search is falling back to database queries. Start Meilisearch locally, then reindex your indexes.
              </p>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-[hsl(var(--dashboard-main-fg))]">
                <li>
                  <code className="rounded bg-[hsl(var(--dashboard-sidebar-active)/0.5)] px-1.5 py-0.5 text-xs">
                    docker compose -f infra/docker/docker-compose.dev.yml up -d meilisearch
                  </code>
                </li>
                <li>
                  Set{' '}
                  <code className="rounded bg-[hsl(var(--dashboard-sidebar-active)/0.5)] px-1.5 py-0.5 text-xs">
                    MEILISEARCH_HOST=http://localhost:7700
                  </code>{' '}
                  in{' '}
                  <code className="rounded bg-[hsl(var(--dashboard-sidebar-active)/0.5)] px-1.5 py-0.5 text-xs">
                    apps/api/.env
                  </code>
                </li>
                <li>Restart the API, then reindex from the admin search tools page.</li>
              </ol>
            </Card>
          ) : null}

          <Card title="Search engine">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <EngineStatusBadge healthy={health?.healthy ?? false} />
                <span className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                  {health?.healthy
                    ? 'Meilisearch is connected and serving search requests.'
                    : 'Meilisearch could not be reached.'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" disabled={!!reindexing} onClick={() => void loadHealth()}>
                  Refresh
                </Button>
                {canReindex ? (
                  <Button
                    variant="default"
                    size="sm"
                    disabled={!!reindexing || !health?.healthy}
                    onClick={() => void handleReindexAll()}
                  >
                    {reindexing === 'all' ? 'Reindexing…' : 'Reindex all'}
                  </Button>
                ) : null}
              </div>
            </div>

            {isSuperAdmin ? (
              <p className="mb-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                Super-admin view is read-only. Operations admins can reindex from{' '}
                <span className="font-medium text-[hsl(var(--dashboard-main-fg))]">Admin → Search Tools</span>.
              </p>
            ) : null}

            {actionError ? <p className="mb-4 text-sm text-destructive">{actionError}</p> : null}

            <DataTable
              columns={[
                'Index',
                'Documents (indexed / expected)',
                'Status',
                'Last updated',
                ...(canReindex ? ['Actions'] : []),
              ]}
              rows={indexes.map((idx) => {
                const job = jobStatuses[idx.indexName];
                const jobLabel =
                  job?.status === 'processing'
                    ? 'Indexing…'
                    : job?.status === 'queued'
                      ? 'Queued'
                      : job?.status === 'completed'
                        ? `Done (${job.indexed ?? 0})`
                        : job?.status === 'failed'
                          ? 'Failed'
                          : null;

                const row: Array<string | ReactNode> = [
                  INDEX_LABELS[idx.indexName] ?? idx.indexName,
                  formatDocumentCounts(idx),
                  <SyncStatusBadge key={`${idx.id}-status`} status={idx.syncStatus ?? (idx.isHealthy ? 'synced' : 'offline')} />,
                  formatIndexUpdated(idx),
                ];

                if (canReindex) {
                  row.push(
                    <div key={`${idx.id}-actions`} className="flex flex-col gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!!reindexing || !health?.healthy}
                        onClick={() => void handleReindex(idx.indexName)}
                      >
                        {reindexing === idx.indexName ? 'Reindexing…' : 'Reindex'}
                      </Button>
                      {jobLabel ? (
                        <span className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{jobLabel}</span>
                      ) : null}
                      {job?.error ? <span className="text-xs text-destructive">{job.error}</span> : null}
                    </div>,
                  );
                }

                return row;
              })}
            />
          </Card>
        </div>
      ) : (
        <SearchAnalyticsPanel analytics={analytics} loading={analyticsLoading} error={analyticsError} />
      )}
    </DashboardPageShell>
  );
}
