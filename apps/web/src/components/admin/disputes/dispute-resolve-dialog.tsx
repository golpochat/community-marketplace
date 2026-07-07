'use client';

import { useEffect, useState } from 'react';

import type { MarketplaceDisputeStatus } from '@community-marketplace/types';
import { DISPUTE_STATUS_LABELS } from '@community-marketplace/types';
import { Dialog } from '@community-marketplace/ui';

type ResolveOutcome = Extract<
  MarketplaceDisputeStatus,
  'resolved_buyer_favored' | 'resolved_seller_favored' | 'closed'
>;

interface DisputeResolveDialogProps {
  open: boolean;
  outcome: ResolveOutcome | null;
  loading?: boolean;
  initialNotes?: string;
  onConfirm: (notes: string) => void;
  onClose: () => void;
}

export function DisputeResolveDialog({
  open,
  outcome,
  loading = false,
  initialNotes = '',
  onConfirm,
  onClose,
}: DisputeResolveDialogProps) {
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    if (open) setNotes(initialNotes);
  }, [open, initialNotes, outcome]);

  if (!outcome) return null;

  const trimmed = notes.trim();
  const title = `Confirm: ${DISPUTE_STATUS_LABELS[outcome]}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={title}
      description="Resolution notes are required and will be shared with both parties."
      confirmLabel="Confirm resolution"
      confirmLoading={loading}
      confirmDisabled={trimmed.length < 1}
      closeOnConfirm={false}
      onConfirm={() => onConfirm(trimmed)}
    >
      <label className="block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
        Resolution notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Explain the outcome and reasoning…"
          className="mt-2 w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-main-bg))] px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))]"
        />
      </label>
    </Dialog>
  );
}
