'use client';

import { useState } from 'react';
import Link from 'next/link';

import { MODERATION_REPORT_REASONS } from '@community-marketplace/types';
import { Button, Select } from '@community-marketplace/ui';

import { Modal } from '@/components/shared/modal';
import { useAuth } from '@/hooks/use-auth';
import { buyerService } from '@/services/marketplace.service';

interface ReportButtonProps {
  listingId: string;
}

const REASON_LABELS: Record<(typeof MODERATION_REPORT_REASONS)[number], string> = {
  fraud: 'Fraud',
  harassment: 'Harassment',
  spam: 'Spam',
  inappropriate_content: 'Inappropriate content',
  scams: 'Scams',
  fake_listing: 'Fake listing',
};

export function ReportButton({ listingId }: ReportButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof MODERATION_REPORT_REASONS)[number]>('fake_listing');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canReport = isAuthenticated && !!user;

  async function handleReport() {
    if (!canReport) return;
    setLoading(true);
    setError(null);
    try {
      await buyerService.reportListing(listingId, {
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
      <Link href={`/auth/login?redirect=/listings/${listingId}`}>
        <Button variant="outline" size="sm">
          Report
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Report
      </Button>
      {success && (
        <span className="text-xs text-green-700">Report submitted. Thank you.</span>
      )}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Report listing"
        description="Tell us why you're reporting this listing."
        confirmLabel={loading ? 'Submitting…' : 'Submit report'}
        onConfirm={() => void handleReport()}
      >
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="space-y-3">
          <div>
            <label htmlFor="report-reason" className="mb-1 block text-sm font-medium text-gray-700">
              Reason
            </label>
            <Select
              id="report-reason"
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
              htmlFor="report-description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Details (optional)
            </label>
            <textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Additional context for moderators…"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
