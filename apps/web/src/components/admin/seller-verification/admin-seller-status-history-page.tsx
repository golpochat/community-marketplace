'use client';

import { useCallback, useState } from 'react';

import { formatDateTime } from '@community-marketplace/utils';
import { Card } from '@community-marketplace/ui-dashboard';

import { SellerStatusBadge } from '@/components/admin/seller-verification/seller-status-badge';
import { AdminTableFooter } from '@/components/dashboard/admin-table-footer';
import { DashboardPageShell } from '@/components/dashboard/async-resource';
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

  return (
    <DashboardPageShell
      title="Seller Verification"
      description={ADMIN_SELLER_VERIFICATION_VIEW_LABELS.history}
      loading={loading}
      error={error}
      empty={!loading && !error && Boolean(searchUserId) && data.length === 0}
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
            <label htmlFor="history-seller-id" className="mb-1 block text-sm font-medium text-slate-700">
              Seller user ID
            </label>
            <input
              id="history-seller-id"
              type="search"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Paste seller user ID"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
          <p className="text-sm text-slate-600">
            Enter a seller user ID to view their verification status change history. You can copy
            the ID from any row in the verification queues.
          </p>
        ) : null}

        {searchUserId && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-3 py-2 font-medium">Old status</th>
                  <th className="px-3 py-2 font-medium">New status</th>
                  <th className="px-3 py-2 font-medium">Changed by</th>
                  <th className="px-3 py-2 font-medium">Reason</th>
                  <th className="px-3 py-2 font-medium">Changed at</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="px-3 py-2">
                      <SellerStatusBadge status={row.oldStatus} />
                    </td>
                    <td className="px-3 py-2">
                      <SellerStatusBadge status={row.newStatus} />
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {row.changedByName ?? (row.changedBy ? row.changedBy.slice(0, 8) : 'System')}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{row.reason ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{formatDateTime(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {searchUserId ? (
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
