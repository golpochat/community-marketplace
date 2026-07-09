'use client';

import { useEffect, useState } from 'react';

import type { Payment } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { Dialog } from '@community-marketplace/ui';

interface RefundRequestDialogProps {
  open: boolean;
  payment: Payment | null;
  loading?: boolean;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export function RefundRequestDialog({
  open,
  payment,
  loading = false,
  onConfirm,
  onClose,
}: RefundRequestDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open, payment?.id]);

  const trimmed = reason.trim();
  const reasonValid = trimmed.length === 0 || trimmed.length >= 3;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Request a refund"
      description={
        payment
          ? `Request a full refund of ${formatCurrency(payment.amount, payment.currency)}. An admin will review your request before any money is returned.`
          : undefined
      }
      confirmLabel="Submit request"
      confirmLoading={loading}
      confirmDisabled={!payment || !reasonValid}
      closeOnConfirm={false}
      onConfirm={() => {
        if (!payment || !reasonValid) {
          setError('Please enter at least 3 characters or leave the reason blank.');
          return;
        }
        setError(null);
        onConfirm(trimmed || undefined);
      }}
    >
      <label className="block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
        Reason (optional)
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError(null);
          }}
          rows={4}
          maxLength={500}
          placeholder="Tell us why you are requesting a refund…"
          className="mt-2 w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-main-bg))] px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))]"
        />
      </label>
      <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        {trimmed.length}/500 characters
        {trimmed.length > 0 && trimmed.length < 3 ? ' · at least 3 characters if provided' : ''}
      </p>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </Dialog>
  );
}
