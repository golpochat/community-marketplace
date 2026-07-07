'use client';

import { useEffect, useState } from 'react';

import { Button } from '@community-marketplace/ui';
import {
  STAFF_ROLE_CHANGE_REASONS,
  STAFF_ROLE_CHANGE_REASON_LABELS,
  type StaffRoleChangeReason,
  type UserProfile,
} from '@community-marketplace/types';

import { staffAdminFieldClassName } from '@/components/dashboard/staff-admin-status-toggle';
import { adminService, type AdminInviteableRoleRow } from '@/services/admin.service';

interface StaffAdminModifyModalProps {
  open: boolean;
  admin: UserProfile | null;
  loading?: boolean;
  onSubmit: (payload: {
    role: string;
    reason: StaffRoleChangeReason;
    reasonDetail?: string;
  }) => void;
  onClose: () => void;
}

export function StaffAdminModifyModal({
  open,
  admin,
  loading = false,
  onSubmit,
  onClose,
}: StaffAdminModifyModalProps) {
  const [roles, setRoles] = useState<AdminInviteableRoleRow[]>([]);
  const [roleCode, setRoleCode] = useState('');
  const [roleReason, setRoleReason] = useState<StaffRoleChangeReason>(STAFF_ROLE_CHANGE_REASONS[0]);
  const [roleReasonDetail, setRoleReasonDetail] = useState('');
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoadingRoles(true);
    void adminService
      .listInviteableRoles()
      .then(setRoles)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingRoles(false));
  }, [open]);

  useEffect(() => {
    if (!open || !admin) return;
    setRoleCode(admin.role);
    setRoleReason(STAFF_ROLE_CHANGE_REASONS[0]);
    setRoleReasonDetail('');
    setError(null);
  }, [open, admin]);

  if (!open || !admin) return null;

  const roleChanged = roleCode !== admin.role;
  const roleReasonInvalid = roleReason === 'other' && !roleReasonDetail.trim();
  const label = admin.displayName?.trim() || admin.email;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-modify-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] shadow-xl">
        <div className="border-b border-[hsl(var(--dashboard-sidebar-border))] px-6 py-4">
          <h3
            id="staff-modify-title"
            className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]"
          >
            Change role — {label}
          </h3>
          <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">{admin.email}</p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div>
            <label
              htmlFor="staff-modify-role"
              className="mb-1 block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]"
            >
              Role
            </label>
            <select
              id="staff-modify-role"
              value={roleCode}
              disabled={loadingRoles}
              onChange={(event) => setRoleCode(event.target.value)}
              className={staffAdminFieldClassName}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.code}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.15)] p-4">
            <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">Reason for change</p>
            <select
              value={roleReason}
              onChange={(event) => setRoleReason(event.target.value as StaffRoleChangeReason)}
              className={staffAdminFieldClassName}
            >
              {STAFF_ROLE_CHANGE_REASONS.map((code) => (
                <option key={code} value={code}>
                  {STAFF_ROLE_CHANGE_REASON_LABELS[code]}
                </option>
              ))}
            </select>
            <textarea
              rows={2}
              value={roleReasonDetail}
              onChange={(event) => setRoleReasonDetail(event.target.value)}
              placeholder={
                roleReason === 'other' ? 'Explain the role change (required)…' : 'Optional details…'
              }
              className={staffAdminFieldClassName}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[hsl(var(--dashboard-sidebar-border))] px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading || !roleChanged || roleReasonInvalid}
            onClick={() =>
              onSubmit({
                role: roleCode,
                reason: roleReason,
                reasonDetail: roleReasonDetail.trim() || undefined,
              })
            }
          >
            {loading ? 'Saving…' : 'Save role'}
          </Button>
        </div>
      </div>
    </div>
  );
}
