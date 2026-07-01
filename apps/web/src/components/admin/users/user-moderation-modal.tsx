'use client';

import { useEffect, useState } from 'react';

const REASON_OPTIONS = [
  'Policy violation',
  'Fraud suspicion',
  'Repeated complaints',
  'Payment abuse',
  'Other',
] as const;

type BanDuration = 'permanent' | '7_days' | '30_days';

export interface UserModerationSubmitPayload {
  reason: string;
  banType?: 'temporary' | 'permanent';
  expiresAt?: string;
}

interface UserModerationModalProps {
  open: boolean;
  action: 'suspend' | 'ban';
  userEmail: string;
  userName?: string;
  loading?: boolean;
  onSubmit: (payload: UserModerationSubmitPayload) => void;
  onClose: () => void;
}

function expiresInDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function resolveBanPayload(duration: BanDuration): Pick<UserModerationSubmitPayload, 'banType' | 'expiresAt'> {
  if (duration === 'permanent') {
    return { banType: 'permanent' };
  }
  return {
    banType: 'temporary',
    expiresAt: expiresInDays(duration === '7_days' ? 7 : 30),
  };
}

export function UserModerationModal({
  open,
  action,
  userEmail,
  userName,
  loading = false,
  onSubmit,
  onClose,
}: UserModerationModalProps) {
  const [reasonType, setReasonType] = useState<string>(REASON_OPTIONS[0]);
  const [reasonDetail, setReasonDetail] = useState('');
  const [banDuration, setBanDuration] = useState<BanDuration>('permanent');

  useEffect(() => {
    if (!open) return;
    setReasonType(REASON_OPTIONS[0]);
    setReasonDetail('');
    setBanDuration('permanent');
  }, [open, action, userEmail]);

  if (!open) return null;

  const label = userName?.trim() || userEmail;
  const reason = [reasonType, reasonDetail.trim()].filter(Boolean).join(': ');
  const isBan = action === 'ban';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-moderation-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] p-6 shadow-xl">
        <h3 id="user-moderation-title" className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]">
          {isBan ? 'Ban user' : 'Suspend user'} — {label}
        </h3>
        <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">{userEmail}</p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="user-mod-reason-type" className="mb-1 block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
              Reason
            </label>
            <select
              id="user-mod-reason-type"
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value)}
              className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))] focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]"
            >
              {REASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="user-mod-reason-detail" className="mb-1 block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
              Details {reasonType === 'Other' ? '(required)' : '(optional)'}
            </label>
            <textarea
              id="user-mod-reason-detail"
              rows={3}
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              placeholder="Add context for the audit log…"
              className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))] focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]"
            />
          </div>

          {isBan && (
            <div>
              <label htmlFor="user-mod-ban-duration" className="mb-1 block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
                Ban duration
              </label>
              <select
                id="user-mod-ban-duration"
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value as BanDuration)}
                className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))] focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]"
              >
                <option value="permanent">Permanent</option>
                <option value="7_days">Temporary — 7 days</option>
                <option value="30_days">Temporary — 30 days</option>
              </select>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !reason.trim() || (reasonType === 'Other' && !reasonDetail.trim())}
            onClick={() =>
              onSubmit({
                reason,
                ...(isBan ? resolveBanPayload(banDuration) : {}),
              })
            }
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Working…' : isBan ? 'Ban user' : 'Suspend user'}
          </button>
        </div>
      </div>
    </div>
  );
}
