'use client';

import { useState } from 'react';

interface RejectVerificationModalProps {
  open: boolean;
  sellerName: string;
  loading?: boolean;
  onSubmit: (reason: string, requestAdditionalDocs: boolean) => void;
  onClose: () => void;
}

export function RejectVerificationModal({
  open,
  sellerName,
  loading = false,
  onSubmit,
  onClose,
}: RejectVerificationModalProps) {
  const [reason, setReason] = useState('');
  const [requestAdditionalDocs, setRequestAdditionalDocs] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">
          Reject Verification – {sellerName}
        </h3>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="reject-reason" className="mb-1 block text-sm font-medium text-slate-700">
              Rejection reason
            </label>
            <textarea
              id="reject-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Explain why this verification was rejected"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={requestAdditionalDocs}
              onChange={(e) => setRequestAdditionalDocs(e.target.checked)}
            />
            Request additional documents
          </label>
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
            disabled={loading || !reason.trim()}
            onClick={() => onSubmit(reason.trim(), requestAdditionalDocs)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Submit rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}
