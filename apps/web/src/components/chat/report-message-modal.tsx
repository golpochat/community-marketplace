'use client';

import { useState } from 'react';

interface ReportMessageModalProps {
  open: boolean;
  loading?: boolean;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

export function ReportMessageModal({
  open,
  loading = false,
  onSubmit,
  onClose,
}: ReportMessageModalProps) {
  const [reason, setReason] = useState('');

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-message-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h3 id="report-message-title" className="text-lg font-semibold text-slate-900">
          Report message
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Tell us why this message violates our community guidelines. Our moderation team will
          review it.
        </p>
        <div className="mt-4">
          <label htmlFor="report-reason" className="mb-1 block text-sm font-medium text-slate-700">
            Reason
          </label>
          <textarea
            id="report-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Spam, harassment, scam, inappropriate content…"
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || reason.trim().length < 3}
            onClick={() => onSubmit(reason.trim())}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  );
}
