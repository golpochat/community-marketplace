'use client';

import { useEffect, useState } from 'react';

import type { SellerStatusHistoryEntry } from '@community-marketplace/types';
import { formatDateTime } from '@community-marketplace/utils';
import { Card } from '@community-marketplace/ui-dashboard';

import { SellerProfileStatusBadge } from '@/components/seller/profile/seller-profile-status-badge';
import { sellerVerificationService } from '@/services/seller-verification.service';

export function SellerStatusHistoryPanel() {
  const [rows, setRows] = useState<SellerStatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void sellerVerificationService
      .getStatusHistory(1, 20)
      .then((result) => {
        if (!cancelled) setRows(result.data);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        // Early seller setup may not have history yet; treat missing seller rows as empty.
        const message = err.message || '';
        if (/seller not found/i.test(message) || /404/.test(message)) {
          setRows([]);
          setError(null);
          return;
        }
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card title="Account status history">
      {loading ? (
        <div className="h-24 animate-pulse rounded-lg bg-[hsl(var(--dashboard-sidebar-active)/0.5)]" />
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!loading && !error && rows.length === 0 ? (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          No status changes recorded yet.
        </p>
      ) : null}
      {!loading && !error && rows.length > 0 ? (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <SellerProfileStatusBadge status={row.newStatus} />
                <span className="text-[hsl(var(--dashboard-sidebar-muted))]">
                  {formatDateTime(row.createdAt)}
                </span>
              </div>
              {row.reason ? (
                <p className="mt-2 text-[hsl(var(--dashboard-main-fg))]">{row.reason}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
