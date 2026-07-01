'use client';

import { useState } from 'react';
import Link from 'next/link';

import { MODERATION_REPORT_REASONS } from '@community-marketplace/types';
import { Button, Label, Select } from '@community-marketplace/ui';

import { Modal } from '@/components/shared/modal';
import { useAuth } from '@/hooks/use-auth';
import { moderationService } from '@/services/moderation.service';

interface ReportUserButtonProps {
  userId: string;
  userName?: string;
  variant?: 'button' | 'link';
}

const REASON_LABELS: Record<(typeof MODERATION_REPORT_REASONS)[number], string> = {
  fraud: 'Fraud',
  harassment: 'Harassment',
  spam: 'Spam',
  inappropriate_content: 'Inappropriate content',
  scams: 'Scams',
  fake_listing: 'Suspicious behaviour',
};

export function ReportUserButton({
  userId,
  userName,
  variant = 'button',
}: ReportUserButtonProps) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof MODERATION_REPORT_REASONS)[number]>('scams');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleReport() {
    setLoading(true);
    setError(null);
    try {
      await moderationService.reportUser({
        targetUserId: userId,
        reason,
        description: description.trim() || undefined,
      });
      setSuccess(true);
      setOpen(false);
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <Link href="/auth/login" className="text-xs text-muted-foreground hover:text-primary">
        Report user
      </Link>
    );
  }

  return (
    <>
      {variant === 'link' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          Report user
        </button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Report user
        </Button>
      )}
      {success && (
        <span className="text-xs text-accent">Report submitted. Thank you.</span>
      )}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={`Report ${userName ?? 'user'}`}
        description="Tell us why you're reporting this account."
        confirmLabel={loading ? 'Submitting…' : 'Submit report'}
        onConfirm={() => void handleReport()}
      >
        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="report-user-reason">Reason</Label>
            <Select
              id="report-user-reason"
              value={reason}
              onChange={(e) =>
                setReason(e.target.value as (typeof MODERATION_REPORT_REASONS)[number])
              }
            >
              {MODERATION_REPORT_REASONS.map((value) => (
                <option key={value} value={value}>
                  {REASON_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-user-description">Details (optional)</Label>
            <textarea
              id="report-user-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors duration-150 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="What happened?"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
