'use client';

import { useEffect, useState } from 'react';

import { Dialog } from '@community-marketplace/ui';

interface FraudReasonDialogProps {
  open: boolean;
  title: string;
  description?: string;
  label?: string;
  placeholder?: string;
  confirmLabel?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  required?: boolean;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export function FraudReasonDialog({
  open,
  title,
  description,
  label = 'Reason',
  placeholder = 'Enter a reason…',
  confirmLabel = 'Confirm',
  variant = 'default',
  loading = false,
  required = true,
  onConfirm,
  onClose,
}: FraudReasonDialogProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) setValue('');
  }, [open, title]);

  const trimmed = value.trim();
  const canConfirm = !required || trimmed.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      variant={variant}
      confirmLoading={loading}
      confirmDisabled={!canConfirm}
      closeOnConfirm={false}
      onConfirm={() => {
        if (!canConfirm) return;
        onConfirm(trimmed);
      }}
    >
      <label className="block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
        {label}
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="mt-2 w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-main-bg))] px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))]"
        />
      </label>
    </Dialog>
  );
}
