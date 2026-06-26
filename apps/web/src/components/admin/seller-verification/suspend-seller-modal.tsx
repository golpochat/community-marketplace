'use client';

import { useState } from 'react';

interface SuspendSellerModalProps {
  open: boolean;
  sellerName: string;
  loading?: boolean;
  onSubmit: (payload: {
    reason: string;
    duration?: '7_days' | '30_days' | 'permanent';
  }) => void;
  onClose: () => void;
}

const REASON_OPTIONS = [
  'Policy violation',
  'Fraud suspicion',
  'Repeated complaints',
  'Other',
];

export function SuspendSellerModal({
  open,
  sellerName,
  loading = false,
  onSubmit,
  onClose,
}: SuspendSellerModalProps) {
  const [reasonType, setReasonType] = useState(REASON_OPTIONS[0]!);
  const [reasonDetail, setReasonDetail] = useState('');
  const [duration, setDuration] = useState<'7_days' | '30_days' | 'permanent' | ''>('');

  if (!open) return null;

  const reason = [reasonType, reasonDetail.trim()].filter(Boolean).join(': ');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Suspend Seller – {sellerName}</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="suspend-reason-type" className="mb-1 block text-sm font-medium text-slate-700">
              Reason for suspension
            </label>
            <select
              id="suspend-reason-type"
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {REASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="suspend-reason-detail" className="mb-1 block text-sm font-medium text-slate-700">
              Details
            </label>
            <textarea
              id="suspend-reason-detail"
              rows={3}
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="suspend-duration" className="mb-1 block text-sm font-medium text-slate-700">
              Duration (optional)
            </label>
            <select
              id="suspend-duration"
              value={duration}
              onChange={(e) =>
                setDuration(e.target.value as '7_days' | '30_days' | 'permanent' | '')
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">No fixed duration</option>
              <option value="7_days">7 days</option>
              <option value="30_days">30 days</option>
              <option value="permanent">Permanent</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !reason.trim()}
            onClick={() =>
              onSubmit({
                reason,
                ...(duration ? { duration } : {}),
              })
            }
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Suspending…' : 'Suspend seller'}
          </button>
        </div>
      </div>
    </div>
  );
}
