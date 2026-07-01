'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ReindexJobStatus, SearchIndexName } from '@community-marketplace/types';
import { Button, Card } from '@community-marketplace/ui-dashboard';
import { formatListedAgo } from '@community-marketplace/utils';

import { DashboardPageShell, DataTable } from '@/components/dashboard/async-resource';
import { StatCard } from '@/components/dashboard/stat-card';
import { adminService, type AdminServiceRole } from '@/services/admin.service';

const INDEX_LABELS: Record<SearchIndexName, string> = {
  listings: 'Listings',
  users: 'Users',
  categories: 'Categories',
  chat_threads: 'Chat threads',
};

function StatusBadge({ healthy }: { healthy: boolean }) {
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

function IndexHealthBadge({ healthy }: { healthy: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        healthy ? 'bg-emerald-50 text-emerald-800' : 'bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-[hsl(var(--dashboard-sidebar-muted))]'
      }`}
    >
      {healthy ? 'Synced' : 'Offline'}
    </span>
  );
}

export function AdminSearchPage({ role }: { role: AdminServiceRole }) {
  const [health, setHealth] = useState<Awaited<ReturnType<typeof adminService.getSearchHealth>>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

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
  const healthyIndexes = indexes.filter((idx) => idx.isHealthy).length;

  return (
    <DashboardPageShell
      title={role === 'ADMIN' ? 'Search Tools' : 'Search'}
      description="Meilisearch health, index status, and reindex controls."
      loading={loading}
      error={error}
      empty={!loading && !error && !health}
      emptyTitle="Search health unavailable"
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Engine status" value={health?.healthy ? 'Online' : 'Offline'} />
          <StatCard label="Indexes" value={`${healthyIndexes} / ${indexes.length}`} />
          <StatCard label="Total documents" value={String(totalDocuments)} />
          <StatCard
            label="Fallback mode"
            value={health?.healthy ? 'Disabled' : 'Database'}
          />
        </div>

        {!health?.healthy && (
          <Card title="Meilisearch is not running">
            <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
              Search is falling back to database queries. Start Meilisearch locally, then reindex
              your indexes.
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-[hsl(var(--dashboard-main-fg))]">
              <li>
                <code className="rounded bg-[hsl(var(--dashboard-sidebar-active)/0.5)] px-1.5 py-0.5 text-xs">
                  docker compose -f infra/docker/docker-compose.dev.yml up -d meilisearch
                </code>
              </li>
              <li>
                Set <code className="rounded bg-[hsl(var(--dashboard-sidebar-active)/0.5)] px-1.5 py-0.5 text-xs">MEILISEARCH_HOST=http://localhost:7700</code>{' '}
                in <code className="rounded bg-[hsl(var(--dashboard-sidebar-active)/0.5)] px-1.5 py-0.5 text-xs">apps/api/.env</code>
              </li>
              <li>Restart the API, then use Reindex all below.</li>
            </ol>
          </Card>
        )}

        <Card title="Search engine">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <StatusBadge healthy={health?.healthy ?? false} />
              <span className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                {health?.healthy
                  ? 'Meilisearch is connected and serving search requests.'
                  : 'Meilisearch could not be reached.'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!!reindexing}
                onClick={() => void loadHealth()}
              >
                Refresh
              </Button>
              <Button
                variant="default"
                size="sm"
                disabled={!!reindexing || !health?.healthy}
                onClick={() => void handleReindexAll()}
              >
                {reindexing === 'all' ? 'Reindexing…' : 'Reindex all'}
              </Button>
            </div>
          </div>
          {actionError && <p className="mb-4 text-sm text-destructive">{actionError}</p>}
          <DataTable
            columns={['Index', 'Documents', 'Status', 'Last synced', 'Actions']}
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

              return [
                INDEX_LABELS[idx.indexName] ?? idx.indexName,
                String(idx.documentCount),
                <IndexHealthBadge key={`${idx.id}-health`} healthy={idx.isHealthy} />,
                idx.lastSyncedAt ? formatListedAgo(idx.lastSyncedAt) : '—',
                <div key={`${idx.id}-actions`} className="flex flex-col gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!!reindexing || !health?.healthy}
                    onClick={() => void handleReindex(idx.indexName)}
                  >
                    {reindexing === idx.indexName ? 'Reindexing…' : 'Reindex'}
                  </Button>
                  {jobLabel && <span className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{jobLabel}</span>}
                  {job?.error && <span className="text-xs text-destructive">{job.error}</span>}
                </div>,
              ];
            })}
          />
        </Card>
      </div>
    </DashboardPageShell>
  );
}
