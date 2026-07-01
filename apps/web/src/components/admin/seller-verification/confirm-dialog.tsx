'use client';

import { Dialog } from '@community-marketplace/ui';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      title={title}
      description={message}
      confirmLabel={confirmLabel}
      variant={tone === 'danger' ? 'destructive' : 'default'}
      closeOnConfirm={false}
      confirmLoading={loading}
      onConfirm={onConfirm}
    />
  );
}
