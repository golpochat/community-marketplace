'use client';

import { useCallback, useState } from 'react';

import { formatDateTime } from '@community-marketplace/utils';
import { Card } from '@community-marketplace/ui-dashboard';

import { SellerStatusBadge } from '@/components/admin/seller-verification/seller-status-badge';
import { AdminTableFooter } from '@/components/dashboard/admin-table-footer';
import { DashboardPageShell } from '@/components/dashboard/async-resource';
import { DashboardFilteredEmptyState } from '@/components/dashboard/dashboard-filtered-empty-state';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { ADMIN_SELLER_VERIFICATION_VIEW_LABELS } from '@/lib/admin-seller-verification-routes';
import {
  adminSellerVerificationService,
  type AdminServiceRole,
} from '@/services/admin-seller-verification.service';

export function AdminSellerStatusHistoryPage({ role }: { role: AdminServiceRole }) {
  const [userId, setUserId] = useState('');
  const [searchUserId, setSearchUserId] = useState('');

  const fetchHistory = useCallback(
    (page: number, limit: number) => {
      if (!searchUserId.trim()) {
        return Promise.resolve({
          data: [],
          meta: { page: 1, limit, total: 0, totalPages: 1 },
        });
      }
      return adminSellerVerificationService.getStatusHistory(
        role,
        searchUserId.trim(),
        page,
        limit,
      );
    },
    [searchUserId, role],
  );

  const { page, setPage, data, meta, loading, error, totalPages } = usePaginatedQuery({
    fetcher: fetchHistory,
    limit: 20,
  });

  const clearSearch = () => {
    setUserId('');
    setSearchUserId('');
    setPage(1);
  };

  return (
    <DashboardPageShell
      title="Seller Verification"
      description={ADMIN_SELLER_VERIFICATION_VIEW_LABELS.history}
      loading={loading}
      error={error}
      empty={!loading && !error && Boolean(searchUserId) && data.length === 0}
      emptyPreserveFilters
      emptyTitle="No status history"
      emptyDescription="No status changes were recorded for this seller."
    >
      <Card>
        <form
          className="mb-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setSearchUserId(userId.trim());
            setPage(1);
          }}
        >
          <div className="min-w-[16rem] flex-1">
            <label htmlFor="history-seller-id" className="mb-1 block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
              Seller user ID
            </label>
            <input
              id="history-seller-id"
              type="search"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Paste seller user ID"
              className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Load history
          </button>
        </form>

        {!searchUserId ? (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Enter a seller user ID to view their verification status change history. You can copy
            the ID from any row in the verification queues.
          </p>
        ) : data.length === 0 ? (
          <DashboardFilteredEmptyState
            title="No status history"
            description="No status changes were recorded for this seller."
            hasActiveFilters
            onClearFilters={clearSearch}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-sidebar-muted))]">
                  <th className="px-3 py-2 font-medium">Old status</th>
                  <th className="px-3 py-2 font-medium">New status</th>
                  <th className="px-3 py-2 font-medium">Changed by</th>
                  <th className="px-3 py-2 font-medium">Reason</th>
                  <th className="px-3 py-2 font-medium">Changed at</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="border-b border-[hsl(var(--dashboard-sidebar-border))]">
                    <td className="px-3 py-2">
                      <SellerStatusBadge status={row.oldStatus} />
                    </td>
                    <td className="px-3 py-2">
                      <SellerStatusBadge status={row.newStatus} />
                    </td>
                    <td className="px-3 py-2 text-[hsl(var(--dashboard-main-fg))]">
                      {row.changedByName ?? (row.changedBy ? row.changedBy.slice(0, 8) : 'System')}
                    </td>
                    <td className="px-3 py-2 text-[hsl(var(--dashboard-main-fg))]">{row.reason ?? '—'}</td>
                    <td className="px-3 py-2 text-[hsl(var(--dashboard-sidebar-muted))]">{formatDateTime(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {searchUserId && data.length > 0 ? (
          <AdminTableFooter
            page={page}
            totalPages={totalPages}
            total={meta.total}
            onPageChange={setPage}
          />
        ) : null}
      </Card>
    </DashboardPageShell>
  );
}
