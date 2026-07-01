'use client';

import { useState } from 'react';

interface ForceReverifyModalProps {
  open: boolean;
  sellerName: string;
  loading?: boolean;
  onSubmit: (payload: { reason: string }) => void;
  onClose: () => void;
}

export function ForceReverifyModal({
  open,
  sellerName,
  loading = false,
  onSubmit,
  onClose,
}: ForceReverifyModalProps) {
  const [reason, setReason] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]">Force Re-Verification – {sellerName}</h3>
        <p className="mt-2 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          Marks the seller as verification required, clears verified status, and creates a new
          verification request. The seller will be notified to re-submit documents.
        </p>
        <div className="mt-4">
          <label htmlFor="force-reverify-reason" className="mb-1 block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
            Reason
          </label>
          <textarea
            id="force-reverify-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            placeholder="Why is re-verification required?"
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !reason.trim()}
            onClick={() => onSubmit({ reason: reason.trim() })}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Force re-verification'}
          </button>
        </div>
      </div>
    </div>
  );
}
