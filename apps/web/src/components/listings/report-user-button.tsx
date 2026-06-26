'use client';

import { useState } from 'react';
import Link from 'next/link';

import { MODERATION_REPORT_REASONS } from '@community-marketplace/types';
import { Button, Select } from '@community-marketplace/ui';

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
      <Link href="/auth/login" className="text-xs text-gray-500 hover:text-primary">
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
          className="text-xs text-gray-500 hover:text-red-600"
        >
          Report user
        </button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Report user
        </Button>
      )}
      {success && (
        <span className="text-xs text-green-700">Report submitted. Thank you.</span>
      )}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={`Report ${userName ?? 'user'}`}
        description="Tell us why you're reporting this account."
        confirmLabel={loading ? 'Submitting…' : 'Submit report'}
        onConfirm={() => void handleReport()}
      >
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="space-y-3">
          <div>
            <label htmlFor="report-user-reason" className="mb-1 block text-sm font-medium text-gray-700">
              Reason
            </label>
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
          <div>
            <label
              htmlFor="report-user-description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Details (optional)
            </label>
            <textarea
              id="report-user-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="What happened?"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
