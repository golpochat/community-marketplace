'use client';

import { useEffect, useState } from 'react';

import type { ListingStatusChangeLog } from '@community-marketplace/types';
import { ListingStatusBadge } from '@community-marketplace/ui-dashboard';

import { adminService, type AdminServiceRole } from '@/services/admin.service';

interface AdminListingStatusHistoryDialogProps {
  open: boolean;
  listingId: string | null;
  listingTitle?: string;
  role: AdminServiceRole;
  onClose: () => void;
}

function formatActor(entry: ListingStatusChangeLog): string {
  if (entry.changedByType === 'SYSTEM') return 'System';
  if (entry.changedByType === 'ADMIN') return 'Admin';
  return 'Seller';
}

export function AdminListingStatusHistoryDialog({
  open,
  listingId,
  listingTitle,
  role,
  onClose,
}: AdminListingStatusHistoryDialogProps) {
  const [entries, setEntries] = useState<ListingStatusChangeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !listingId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void adminService
      .getListingStatusHistory(role, listingId)
      .then((data) => {
        if (cancelled) return;
        setEntries(Array.isArray(data) ? data : []);
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
  }, [open, listingId, role]);

  if (!open || !listingId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] shadow-lg"
      >
        <div className="border-b border-[hsl(var(--dashboard-sidebar-border))] px-6 py-4">
          <h2 className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]">Status history</h2>
          {listingTitle && <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">{listingTitle}</p>}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading history…</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && entries.length === 0 && (
            <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No status changes recorded yet.</p>
          )}
          <ul className="space-y-4">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  {entry.fromStatus ? (
                    <>
                      <ListingStatusBadge status={entry.fromStatus} />
                      <span className="text-[hsl(var(--dashboard-sidebar-muted))]">→</span>
                    </>
                  ) : null}
                  <ListingStatusBadge status={entry.toStatus} />
                </div>
                <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                  {formatActor(entry)} · {new Date(entry.createdAt).toLocaleString()}
                </p>
                {entry.reason && (
                  <p className="mt-1 text-xs text-[hsl(var(--dashboard-main-fg))] whitespace-pre-wrap">{entry.reason}</p>
                )}
              </li>
            ))}
          </ul>
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
