'use client';

import { useEffect, useState } from 'react';

import {
  VERIFICATION_DEEP_LINK_STEP_LABELS,
  VERIFICATION_DEEP_LINK_STEPS,
  type VerificationDeepLinkStep,
} from '@community-marketplace/types';

interface RejectVerificationModalProps {
  open: boolean;
  sellerName: string;
  isFastTrack?: boolean;
  title?: string;
  loading?: boolean;
  showAdditionalDocsOption?: boolean;
  onSubmit: (
    reason: string,
    requestAdditionalDocs: boolean,
    targetStep?: VerificationDeepLinkStep,
  ) => void;
  onClose: () => void;
}

export function RejectVerificationModal({
  open,
  sellerName,
  isFastTrack = false,
  title,
  loading = false,
  showAdditionalDocsOption = true,
  onSubmit,
  onClose,
}: RejectVerificationModalProps) {
  const [reason, setReason] = useState('');
  const [requestAdditionalDocs, setRequestAdditionalDocs] = useState(false);
  const [targetStep, setTargetStep] = useState<VerificationDeepLinkStep | ''>('id_document');

  useEffect(() => {
    if (!open) {
      setReason('');
      setRequestAdditionalDocs(false);
      setTargetStep('id_document');
    }
  }, [open]);

  if (!open) return null;

  const heading = title ?? `Reject verification – ${sellerName}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-foreground">{heading}</h3>
        <div className="mt-4 space-y-4">
          {isFastTrack ? (
            <p className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
              This is a paid fast-track case. Rejecting will grant the seller one complimentary
              priority re-queue on their next resubmission (review speed only — not approval).
            </p>
          ) : null}
          <div>
            <label htmlFor="reject-reason" className="mb-1 block text-sm font-medium text-foreground">
              Rejection reason <span className="text-destructive">*</span>
            </label>
            <textarea
              id="reject-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Explain why this verification was rejected so the user knows what to fix."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              A reason is required — this prevents accidental rejections.
            </p>
          </div>
          <div>
            <label htmlFor="reject-target-step" className="mb-1 block text-sm font-medium text-foreground">
              Send seller to step
            </label>
            <select
              id="reject-target-step"
              value={targetStep}
              onChange={(e) => setTargetStep(e.target.value as VerificationDeepLinkStep | '')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {VERIFICATION_DEEP_LINK_STEPS.map((step) => (
                <option key={step} value={step}>
                  {VERIFICATION_DEEP_LINK_STEP_LABELS[step]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Their notification will open this verification step directly.
            </p>
          </div>
          {showAdditionalDocsOption ? (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={requestAdditionalDocs}
                onChange={(e) => setRequestAdditionalDocs(e.target.checked)}
              />
              Request additional documents
            </label>
          ) : null}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !reason.trim()}
            onClick={() =>
              onSubmit(
                reason.trim(),
                requestAdditionalDocs,
                targetStep || undefined,
              )
            }
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Submit rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}
