'use client';

import { useEffect, useState } from 'react';

import { Button } from '@community-marketplace/ui';
import {
  STAFF_STATUS_CHANGE_REASONS,
  STAFF_STATUS_CHANGE_REASON_LABELS,
  type StaffStatusChangeReason,
} from '@community-marketplace/types';

import { staffAdminFieldClassName } from '@/components/dashboard/staff-admin-status-toggle';

interface StaffAdminStatusChangeModalProps {
  open: boolean;
  userLabel: string;
  userEmail: string;
  nextStatus: 'active' | 'inactive';
  loading?: boolean;
  onSubmit: (payload: {
    status: 'active' | 'inactive';
    reason: StaffStatusChangeReason;
    reasonDetail?: string;
  }) => void;
  onClose: () => void;
}

export function StaffAdminStatusChangeModal({
  open,
  userLabel,
  userEmail,
  nextStatus,
  loading = false,
  onSubmit,
  onClose,
}: StaffAdminStatusChangeModalProps) {
  const [reason, setReason] = useState<StaffStatusChangeReason>(STAFF_STATUS_CHANGE_REASONS[0]);
  const [reasonDetail, setReasonDetail] = useState('');

  useEffect(() => {
    if (!open) return;
    setReason(nextStatus === 'active' ? 'return_to_active' : STAFF_STATUS_CHANGE_REASONS[0]);
    setReasonDetail('');
  }, [open, nextStatus, userEmail]);

  if (!open) return null;

  const statusLabel = nextStatus === 'active' ? 'Activate' : 'Deactivate';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-status-change-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] p-6 shadow-xl">
        <h3
          id="staff-status-change-title"
          className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]"
        >
          {statusLabel} staff member — {userLabel}
        </h3>
        <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">{userEmail}</p>

        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="staff-status-reason"
              className="mb-1 block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]"
            >
              Reason
            </label>
            <select
              id="staff-status-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value as StaffStatusChangeReason)}
              className={staffAdminFieldClassName}
            >
              {STAFF_STATUS_CHANGE_REASONS.map((code) => (
                <option key={code} value={code}>
                  {STAFF_STATUS_CHANGE_REASON_LABELS[code]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="staff-status-reason-detail"
              className="mb-1 block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]"
            >
              Details {reason === 'other' ? '(required)' : '(optional)'}
            </label>
            <textarea
              id="staff-status-reason-detail"
              rows={3}
              value={reasonDetail}
              onChange={(event) => setReasonDetail(event.target.value)}
              placeholder="Add context for the audit log…"
              className={staffAdminFieldClassName}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() =>
              onSubmit({
                status: nextStatus,
                reason,
                reasonDetail: reasonDetail.trim() || undefined,
              })
            }
            disabled={loading || (reason === 'other' && !reasonDetail.trim())}
          >
            {loading ? 'Saving…' : statusLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
