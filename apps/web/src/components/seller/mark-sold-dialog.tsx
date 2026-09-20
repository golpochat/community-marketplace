'use client';

import { useState } from 'react';

import {
  LISTING_SALE_CLOSE_CHANNELS,
  LISTING_SALE_CLOSE_CHANNEL_LABELS,
  type ListingSaleCloseChannel,
} from '@community-marketplace/utils';

interface MarkSoldDialogProps {
  open: boolean;
  confirming?: boolean;
  onClose: () => void;
  onConfirm: (closeChannel: ListingSaleCloseChannel) => void;
}

export function MarkSoldDialog({
  open,
  confirming = false,
  onClose,
  onConfirm,
}: MarkSoldDialogProps) {
  const [selected, setSelected] = useState<ListingSaleCloseChannel>('cash_collection');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal
        aria-labelledby="mark-sold-dialog-title"
        className="w-full max-w-md rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] p-6 shadow-lg"
      >
        <h2
          id="mark-sold-dialog-title"
          className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]"
        >
          How was this sold?
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          Card checkout on SellNearby has a receipt and a dispute path. Cash or off-platform
          sales have no seller service fee.
        </p>
        <div className="mt-4 space-y-2">
          {LISTING_SALE_CLOSE_CHANNELS.filter((channel) => channel !== 'card_on_platform').map(
            (channel) => (
              <label
                key={channel}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]"
              >
                <input
                  type="radio"
                  name="sale-close-channel"
                  value={channel}
                  checked={selected === channel}
                  onChange={() => setSelected(channel)}
                  className="mt-1"
                />
                <span className="text-sm text-[hsl(var(--dashboard-main-fg))]">
                  {LISTING_SALE_CLOSE_CHANNEL_LABELS[channel]}
                </span>
              </label>
            ),
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            disabled={confirming}
            className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {confirming ? 'Saving…' : 'Mark as sold'}
          </button>
        </div>
      </div>
    </div>
  );
}
