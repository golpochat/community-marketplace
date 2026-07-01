'use client';

import { useEffect, useState } from 'react';

import type { SellerStatusHistoryEntry } from '@community-marketplace/types';
import { formatDateTime } from '@community-marketplace/utils';

import { SellerStatusBadge } from '@/components/admin/seller-verification/seller-status-badge';
import {
  adminSellerVerificationService,
  type AdminServiceRole,
} from '@/services/admin-seller-verification.service';

interface StatusHistoryModalProps {
  open: boolean;
  role: AdminServiceRole;
  userId: string | null;
  sellerName?: string;
  onClose: () => void;
}

export function StatusHistoryModal({
  open,
  role,
  userId,
  sellerName,
  onClose,
}: StatusHistoryModalProps) {
  const [rows, setRows] = useState<SellerStatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) {
      setRows([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void adminSellerVerificationService
      .getStatusHistory(role, userId)
      .then((result) => {
        if (!cancelled) setRows(result.data);
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
  }, [open, userId, role]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] shadow-xl">
        <div className="border-b border-[hsl(var(--dashboard-sidebar-border))] px-6 py-4">
          <h3 className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]">
            Seller Status History – {sellerName ?? 'Seller'}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? <div className="h-32 animate-pulse rounded-lg bg-[hsl(var(--dashboard-sidebar-active)/0.5)]" /> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!loading && !error && rows.length === 0 ? (
            <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No status changes recorded for this seller.</p>
          ) : null}
          {!loading && !error && rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-sidebar-muted))]">
                    <th className="px-3 py-2 font-medium">Old status</th>
                    <th className="px-3 py-2 font-medium">New status</th>
                    <th className="px-3 py-2 font-medium">Changed by</th>
                    <th className="px-3 py-2 font-medium">Reason</th>
                    <th className="px-3 py-2 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-[hsl(var(--dashboard-sidebar-border))]">
                      <td className="px-3 py-3">
                        <SellerStatusBadge status={row.oldStatus} />
                      </td>
                      <td className="px-3 py-3">
                        <SellerStatusBadge status={row.newStatus} />
                      </td>
                      <td className="px-3 py-3 text-[hsl(var(--dashboard-main-fg))]">
                        {row.changedByName ?? (row.changedBy ? row.changedBy.slice(0, 8) : 'System')}
                      </td>
                      <td className="px-3 py-3 text-[hsl(var(--dashboard-main-fg))]">{row.reason ?? '—'}</td>
                      <td className="px-3 py-3 text-[hsl(var(--dashboard-main-fg))]">{formatDateTime(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
        <div className="border-t border-[hsl(var(--dashboard-sidebar-border))] px-6 py-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
