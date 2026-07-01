'use client';

import { useState } from 'react';

import { Card } from '@community-marketplace/ui-dashboard';

import { disputesService } from '@/services/disputes.service';

export function DisputeRespondForm({
  disputeId,
  onSubmitted,
}: {
  disputeId: string;
  onSubmitted?: () => void;
}) {
  const [messageText, setMessageText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await disputesService.respond({
        disputeId,
        messageText: messageText.trim(),
        file: file ?? undefined,
        evidenceDescription: evidenceDescription.trim() || undefined,
      });
      setMessageText('');
      setFile(null);
      setEvidenceDescription('');
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send response');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Respond to dispute">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          rows={4}
          placeholder="Your response…"
          className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
          required
        />
        <div>
          <p className="mb-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">Optional supporting evidence</p>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-[hsl(var(--dashboard-main-fg))]"
          />
        </div>
        {file ? (
          <input
            value={evidenceDescription}
            onChange={(e) => setEvidenceDescription(e.target.value)}
            placeholder="Evidence description…"
            className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
          />
        ) : null}
        <button
          type="submit"
          disabled={submitting || !messageText.trim()}
          className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Send response'}
        </button>
      </form>
    </Card>
  );
}
