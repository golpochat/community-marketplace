'use client';

import { Dialog, Label } from '@community-marketplace/ui';
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

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Report message"
      description="Tell us why this message violates our community guidelines. Our moderation team will review it."
      confirmLabel={loading ? 'Submitting…' : 'Submit report'}
      variant="destructive"
      closeOnConfirm={false}
      confirmLoading={loading}
      confirmDisabled={loading || reason.trim().length < 3}
      onConfirm={() => onSubmit(reason.trim())}
    >
      <div>
        <Label htmlFor="report-reason">Reason</Label>
        <textarea
          id="report-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Spam, harassment, scam, inappropriate content…"
        />
      </div>
    </Dialog>
  );
}
