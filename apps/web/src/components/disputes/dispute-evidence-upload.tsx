'use client';

import { useState } from 'react';

import { Card } from '@community-marketplace/ui-dashboard';

import { disputesService } from '@/services/disputes.service';

export function DisputeEvidenceUpload({
  disputeId,
  onUploaded,
}: {
  disputeId: string;
  onUploaded?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(false);
    try {
      await disputesService.uploadEvidenceFile(disputeId, file, description.trim() || undefined);
      setSuccess(true);
      setFile(null);
      setDescription('');
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload evidence');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card title="Upload evidence">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? (
          <p className="text-sm text-emerald-700">Evidence uploaded successfully.</p>
        ) : null}
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-[hsl(var(--dashboard-main-fg))]"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Optional description…"
          className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!file || uploading}
          className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)] disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>
    </Card>
  );
}
