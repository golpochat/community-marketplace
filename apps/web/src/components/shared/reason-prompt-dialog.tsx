'use client';

import { useEffect, useState } from 'react';

import { Dialog } from '@community-marketplace/ui';

export interface ReasonPromptDialogProps {
  open: boolean;
  title: string;
  description?: string;
  label?: string;
  placeholder?: string;
  confirmLabel?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  required?: boolean;
  defaultValue?: string;
  elevated?: boolean;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

/** Branded text prompt — replaces browser `window.prompt`. */
export function ReasonPromptDialog({
  open,
  title,
  description,
  label = 'Reason',
  placeholder = 'Enter details…',
  confirmLabel = 'Confirm',
  variant = 'default',
  loading = false,
  required = true,
  defaultValue = '',
  elevated = false,
  onConfirm,
  onClose,
}: ReasonPromptDialogProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, title, defaultValue]);

  const trimmed = value.trim();
  const canConfirm = !required || trimmed.length > 0;

  return (
    <Dialog
      open={open}
      elevated={elevated}
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
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </label>
    </Dialog>
  );
}

/** @deprecated Use `ReasonPromptDialog`. */
export const FraudReasonDialog = ReasonPromptDialog;
