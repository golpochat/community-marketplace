'use client';

import { useState } from 'react';

interface SetListingLimitModalProps {
  open: boolean;
  sellerName: string;
  currentLimit: number;
  loading?: boolean;
  onSubmit: (payload: { sellerLimit: number; reason?: string }) => void;
  onClose: () => void;
}

export function SetListingLimitModal({
  open,
  sellerName,
  currentLimit,
  loading = false,
  onSubmit,
  onClose,
}: SetListingLimitModalProps) {
  const [sellerLimit, setSellerLimit] = useState(String(currentLimit));
  const [reason, setReason] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]">Set Listing Limit – {sellerName}</h3>
        <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Current limit: {currentLimit}</p>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="seller-limit" className="mb-1 block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
              New limit
            </label>
            <input
              id="seller-limit"
              type="number"
              min={0}
              max={100}
              value={sellerLimit}
              onChange={(e) => setSellerLimit(e.target.value)}
              className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="limit-reason" className="mb-1 block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
              Reason (optional)
            </label>
            <textarea
              id="limit-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]">
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || Number.isNaN(Number(sellerLimit))}
            onClick={() =>
              onSubmit({
                sellerLimit: Number(sellerLimit),
                ...(reason.trim() ? { reason: reason.trim() } : {}),
              })
            }
            className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save limit'}
          </button>
        </div>
      </div>
    </div>
  );
}
