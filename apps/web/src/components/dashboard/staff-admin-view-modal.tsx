'use client';

import { useEffect, useState } from 'react';

import { Button } from '@community-marketplace/ui';
import {
  formatAuditActivityDetail,
  formatAuditEventLabel,
} from '@community-marketplace/utils';

import { adminService } from '@/services/admin.service';

interface StaffAdminViewModalProps {
  open: boolean;
  userId: string | null;
  onClose: () => void;
}

function formatStaffRoleLabel(role: string): string {
  if (role === 'ADMIN') return 'Admin';
  return role
    .replace(/_ADMIN$/, '')
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

export function StaffAdminViewModal({ open, userId, onClose }: StaffAdminViewModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof adminService.getAdminStaffMember>> | null>(
    null,
  );

  useEffect(() => {
    if (!open || !userId) {
      setDetail(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    void adminService
      .getAdminStaffMember(userId)
      .then(setDetail)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, userId]);

  if (!open) return null;

  const profile = detail?.profile;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-view-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] shadow-xl">
        <div className="flex items-center justify-between border-b border-[hsl(var(--dashboard-sidebar-border))] px-6 py-4">
          <div>
            <h3
              id="staff-view-title"
              className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]"
            >
              Staff member
            </h3>
            {profile ? (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">{profile.email}</p>
            ) : null}
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
          ) : profile ? (
            <div className="space-y-6">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
                    Name
                  </dt>
                  <dd className="mt-1 text-sm text-[hsl(var(--dashboard-main-fg))]">
                    {profile.displayName ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
                    Role
                  </dt>
                  <dd className="mt-1 text-sm text-[hsl(var(--dashboard-main-fg))]">
                    {formatStaffRoleLabel(profile.role)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
                    Status
                  </dt>
                  <dd className="mt-1 text-sm capitalize text-[hsl(var(--dashboard-main-fg))]">
                    {profile.status}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
                    Member since
                  </dt>
                  <dd className="mt-1 text-sm text-[hsl(var(--dashboard-main-fg))]">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>

              <div>
                <h4 className="text-sm font-semibold text-[hsl(var(--dashboard-main-fg))]">
                  Role & status history
                </h4>
                {detail.auditHistory.length === 0 ? (
                  <p className="mt-2 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                    No role or status changes recorded yet.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-[hsl(var(--dashboard-sidebar-border))] rounded-lg border border-[hsl(var(--dashboard-sidebar-border))]">
                    {detail.auditHistory.map((entry) => (
                      <li key={entry.id} className="px-4 py-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
                            {formatAuditEventLabel(entry.eventType, 'user')}
                          </span>
                          <time className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                            {new Date(entry.createdAt).toLocaleString()}
                          </time>
                        </div>
                        <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                          {formatAuditActivityDetail({
                            eventType: entry.eventType,
                            source: 'user',
                            actorLabel: entry.actorLabel,
                            metadata: entry.metadata,
                          })}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-[hsl(var(--dashboard-sidebar-border))] px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
