'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { DISPUTE_REASONS, DISPUTE_REASON_LABELS } from '@community-marketplace/types';
import type { DisputeReason } from '@community-marketplace/types';
import { Card } from '@community-marketplace/ui-dashboard';

import { disputesService } from '@/services/disputes.service';

export function CreateDisputeForm({
  listingId,
  paymentId,
  redirectTo = '/buyer/disputes',
}: {
  listingId: string;
  paymentId?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState<DisputeReason>('item_not_as_described');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const dispute = await disputesService.create({
        listingId,
        paymentId,
        reason,
        description: description.trim(),
      });
      router.push(`${redirectTo}/${dispute.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open dispute');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Open a dispute">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div>
          <label htmlFor="dispute-reason" className="mb-1 block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
            Reason
          </label>
          <select
            id="dispute-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as DisputeReason)}
            className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            required
          >
            {DISPUTE_REASONS.map((value) => (
              <option key={value} value={value}>
                {DISPUTE_REASON_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="dispute-description"
            className="mb-1 block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]"
          >
            Description
          </label>
          <textarea
            id="dispute-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            minLength={10}
            maxLength={5000}
            placeholder="Describe the issue in detail…"
            className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting || description.trim().length < 10}
          className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit dispute'}
        </button>
      </form>
    </Card>
  );
}
