'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ReindexJobStatus, SearchAnalyticsSummary, SearchIndexMeta } from '@community-marketplace/types';
import { formatDateTime } from '@community-marketplace/utils';

import { StatCard } from '@/components/dashboard/stat-card';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { getStoredAdminRole } from '@/store/admin-auth.store';
import { adminService } from '@/services/admin.service';

const INDEX_TYPES = ['listings', 'users', 'categories', 'chat_threads'] as const;

export default function AdminSearchPage() {
  const { user } = useAdminAuth();
  const [role, setRole] = useState<'SUPER_ADMIN' | 'ADMIN' | null>(null);
  const [indexes, setIndexes] = useState<SearchIndexMeta[]>([]);
  const [health, setHealth] = useState<{ healthy: boolean; message?: string } | null>(null);
  const [analytics, setAnalytics] = useState<SearchAnalyticsSummary | null>(null);
  const [reindexJobs, setReindexJobs] = useState<Record<string, ReindexJobStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolved =
      user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
        ? user.role
        : getStoredAdminRole();
    setRole(resolved);
  }, [user?.role]);

  const load = useCallback(async () => {
    if (!role) return;
    setLoading(true);
    setError(null);
    try {
      const [indexData, healthData, analyticsData] = await Promise.all([
        adminService.getSearchIndexes(role),
        adminService.getSearchHealth(role),
        adminService.getSearchAnalytics(role),
      ]);
      setIndexes(indexData as SearchIndexMeta[]);
      setHealth(healthData as { healthy: boolean; message?: string });
      setAnalytics(analyticsData as SearchAnalyticsSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load search data');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  const triggerReindex = async (type: string) => {
    if (!role) {
      setError('Session not ready — please refresh and try again.');
      return;
    }
    setError(null);
    try {
      const status = (await adminService.reindexSearch(type, role)) as ReindexJobStatus;
      setReindexJobs((prev) => ({ ...prev, [type]: status }));
      const poll = async () => {
        const next = (await adminService.getReindexStatus(type, role)) as ReindexJobStatus;
        setReindexJobs((prev) => ({ ...prev, [type]: next }));
        if (next.status === 'queued' || next.status === 'processing') {
          setTimeout(() => void poll(), 2000);
        } else {
          void load();
        }
      };
      setTimeout(() => void poll(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reindex failed');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Search Management</h1>
      <p className="mt-1 text-sm text-gray-600">Index health, reindex jobs, and search analytics</p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Meilisearch"
          value={health?.healthy ? 'Healthy' : 'Unavailable'}
        />
        <StatCard label="Total Searches" value={String(analytics?.totalSearches ?? 0)} />
        <StatCard
          label="Click-through Rate"
          value={`${((analytics?.clickThroughRate ?? 0) * 100).toFixed(1)}%`}
        />
        <StatCard label="Indexes" value={String(indexes.length)} />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-foreground">Indexes</h2>
        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading indexes…</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Index</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Documents</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Health</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Last Synced</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {indexes.map((index) => (
                  <tr key={index.indexName}>
                    <td className="px-4 py-3 font-medium">{index.indexName}</td>
                    <td className="px-4 py-3">{index.documentCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          index.isHealthy
                            ? 'text-green-600'
                            : 'text-amber-600'
                        }
                      >
                        {index.isHealthy ? 'Healthy' : 'Degraded'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {index.lastSyncedAt
                        ? formatDateTime(index.lastSyncedAt)
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void triggerReindex(index.indexName)}
                        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        Reindex
                      </button>
                      {reindexJobs[index.indexName] && (
                        <span className="ml-2 text-xs text-gray-500">
                          {reindexJobs[index.indexName].status}
                          {reindexJobs[index.indexName].indexed != null
                            ? ` (${reindexJobs[index.indexName].indexed})`
                            : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {analytics && (
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-foreground">Popular Keywords</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              {analytics.popularKeywords.slice(0, 8).map((item) => (
                <li key={item.query} className="flex justify-between">
                  <span>{item.query}</span>
                  <span className="text-gray-400">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-foreground">Zero-Result Queries</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              {analytics.zeroResultQueries.slice(0, 8).map((item) => (
                <li key={item.query} className="flex justify-between">
                  <span>{item.query}</span>
                  <span className="text-gray-400">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-medium text-foreground">Quick Reindex</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {INDEX_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => void triggerReindex(type)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Reindex {type}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
