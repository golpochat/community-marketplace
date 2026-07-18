'use client';

import { useEffect, useState } from 'react';

import type { UserAuditLog } from '@community-marketplace/types';
import {
  formatAuditActivityDetail,
  formatAuditEventLabel,
  formatDateTime,
} from '@community-marketplace/utils';

import { adminService, type AdminServiceRole } from '@/services/admin.service';

const STATUS_EVENT_TYPES = new Set([
  'status_changed',
  'user_suspended',
  'user_unsuspended',
  'user_banned',
  'user_unbanned',
]);

interface UserStatusHistoryModalProps {
  open: boolean;
  userId: string | null;
  userEmail: string;
  role: AdminServiceRole;
  onClose: () => void;
}

export function UserStatusHistoryModal({
  open,
  userId,
  userEmail,
  role,
  onClose,
}: UserStatusHistoryModalProps) {
  const [entries, setEntries] = useState<UserAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) {
      setEntries([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void adminService
      .listUserAuditLogs(role, { targetUserId: userId, limit: 50 })
      .then((result) => {
        if (cancelled) return;
        setEntries(result.data.filter((entry) => STATUS_EVENT_TYPES.has(entry.eventType)));
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
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-status-history-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] shadow-xl">
        <div className="flex items-center justify-between border-b border-[hsl(var(--dashboard-sidebar-border))] px-6 py-4">
          <div>
            <h3
              id="user-status-history-title"
              className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]"
            >
              Status history
            </h3>
            <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.5)]"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
              No status changes recorded yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {entries.map((entry) => {
                const detail = formatAuditActivityDetail({
                  eventType: entry.eventType,
                  source: 'user',
                  metadata: entry.metadata,
                });
                const detailText = detail && detail !== '—' ? detail : null;
                return (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2"
                  >
                    <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
                      {formatAuditEventLabel(entry.eventType, 'user')}
                    </p>
                    {detailText ? (
                      <p className="mt-0.5 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                        {detailText}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
