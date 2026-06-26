'use client';

import { useEffect, useState } from 'react';

import type { SellerVerificationStatus } from '@community-marketplace/types';
import { SELLER_VERIFICATION_MESSAGES } from '@community-marketplace/types';
import { Card } from '@community-marketplace/ui-dashboard';

import { VerificationProgressBar } from '@/components/seller/verification';
import { sellerVerificationService } from '@/services/seller-verification.service';

import { SellerProfileStatusBadge } from './seller-profile-status-badge';
import { SellerStatusHistoryPanel } from './seller-status-history-panel';

const STEPS = [
  { id: 1, label: 'Phone' },
  { id: 2, label: 'ID upload' },
  { id: 3, label: 'Address (optional)' },
  { id: 4, label: 'Submit' },
] as const;

function activeStepIndex(status: SellerVerificationStatus | null): number {
  if (!status) return 0;
  if (status.sellerStatus === 'verified' || status.verificationRequestedAt) return 4;
  if (!status.phoneVerified) return 0;
  if (!status.idVerified && !status.pendingRequest?.idDocumentPath) return 1;
  if (!status.pendingRequest?.selfiePath) return 2;
  return 3;
}

function FilePreview({ file, label }: { file?: File; label: string }) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="max-h-40 rounded-lg border object-contain" />
      ) : (
        <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400">
          No file selected
        </div>
      )}
    </div>
  );
}

interface SellerVerificationFlowProps {
  onSubmitted?: () => void;
}

export function SellerVerificationFlow({ onSubmitted }: SellerVerificationFlowProps) {
  const [status, setStatus] = useState<SellerVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [files, setFiles] = useState<{
    idDocument?: File;
    selfie?: File;
    addressProof?: File;
  }>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await sellerVerificationService.getStatus();
      setStatus(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verification');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const step = activeStepIndex(status);
  const canSubmitDocs =
    status &&
    status.sellerStatus !== 'verified' &&
    !status.verificationRequestedAt &&
    status.phoneVerified &&
    status.emailVerified;

  async function handleSendOtp() {
    if (!phone.trim()) {
      setError('Enter your phone number.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await sellerVerificationService.phone({
        action: 'send_otp',
        phone: phone.trim(),
      });
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await sellerVerificationService.phone({
        action: 'verify_otp',
        phone: phone.trim(),
        code: otpCode.trim(),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitDocuments(event: React.FormEvent) {
    event.preventDefault();
    if (!files.idDocument || !files.selfie) {
      setError('ID document and selfie are required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const [idDocumentPath, selfiePath, addressDocumentPath] = await Promise.all([
        sellerVerificationService.uploadDocument(files.idDocument, 'id'),
        sellerVerificationService.uploadDocument(files.selfie, 'selfie'),
        files.addressProof
          ? sellerVerificationService.uploadDocument(files.addressProof, 'address')
          : Promise.resolve(undefined),
      ]);

      await sellerVerificationService.submit({
        idDocumentPath,
        selfiePath,
        ...(addressDocumentPath ? { addressDocumentPath } : {}),
        ...(phone.trim() ? { phoneNumber: phone.trim() } : {}),
      });
      setFiles({});
      await load();
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading verification…</p>;
  }

  if (!status) {
    return <p className="text-sm text-red-600">{error ?? 'Unable to load verification status.'}</p>;
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {status.sellerStatus !== 'verified' && (
        <VerificationProgressBar
          used={status.unverifiedListingCount}
          limit={status.sellerLimit}
        />
      )}

      <Card title="Verification progress">
        <ol className="mb-6 flex flex-wrap gap-2">
          {STEPS.map((item, index) => (
            <li
              key={item.id}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                index <= step
                  ? 'bg-[hsl(var(--dashboard-accent))] text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {item.id}. {item.label}
            </li>
          ))}
        </ol>

        <dl className="mb-6 grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-2 sm:flex-col">
            <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Status</dt>
            <dd>
              <SellerProfileStatusBadge status={status.sellerStatus} />
            </dd>
          </div>
          <div className="flex justify-between gap-2 sm:flex-col">
            <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Phone</dt>
            <dd>{status.phoneVerified ? 'Verified' : 'Required'}</dd>
          </div>
          <div className="flex justify-between gap-2 sm:flex-col">
            <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Email</dt>
            <dd>{status.emailVerified ? 'Verified' : 'Required'}</dd>
          </div>
          <div className="flex justify-between gap-2 sm:flex-col">
            <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Identity</dt>
            <dd>
              {status.idVerified
                ? 'Verified'
                : status.sellerStatus === 'under_review'
                  ? 'Under review'
                  : 'Pending'}
            </dd>
          </div>
        </dl>

        {status.sellerStatus === 'verified' && (
          <p className="text-sm font-medium text-emerald-700">
            {SELLER_VERIFICATION_MESSAGES.APPROVED}
            {status.verificationCompletedAt
              ? ` Verified on ${new Date(status.verificationCompletedAt).toLocaleDateString()}.`
              : ''}
          </p>
        )}

        {status.sellerStatus === 'under_review' && (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            {SELLER_VERIFICATION_MESSAGES.UNDER_REVIEW}
          </p>
        )}

        {status.verificationRejectedReason && (
          <p className="mb-4 text-sm text-red-700">{status.verificationRejectedReason}</p>
        )}

        {status.sellerStatus !== 'verified' && status.sellerStatus !== 'under_review' && (
          <>
            {(step === 0 || !status.phoneVerified) && (
              <div className="space-y-4 border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold">Step 1 — Phone verification</h3>
                <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                  Enter your phone number and the one-time code we send you.
                </p>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+353 …"
                  className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  disabled={status.phoneVerified}
                />
                {!status.phoneVerified && !otpSent && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleSendOtp()}
                    className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Send code
                  </button>
                )}
                {!status.phoneVerified && otpSent && (
                  <form onSubmit={(e) => void handleVerifyOtp(e)} className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter OTP"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      Verify phone
                    </button>
                  </form>
                )}
                {status.phoneVerified && (
                  <p className="text-sm text-emerald-700">Phone verified.</p>
                )}
              </div>
            )}

            {canSubmitDocs && (
              <form
                onSubmit={(e) => void handleSubmitDocuments(e)}
                className="space-y-6 border-t border-gray-100 pt-4"
              >
                <div>
                  <h3 className="text-sm font-semibold">Step 2 — ID upload</h3>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">Government ID</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setFiles((c) => ({
                            ...c,
                            idDocument: e.target.files?.[0],
                          }))
                        }
                        className="text-sm"
                      />
                      <FilePreview file={files.idDocument} label="ID preview" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">Selfie with ID</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setFiles((c) => ({
                            ...c,
                            selfie: e.target.files?.[0],
                          }))
                        }
                        className="text-sm"
                      />
                      <FilePreview file={files.selfie} label="Selfie preview" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Step 3 — Address proof (optional)</h3>
                  <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                    Utility bill or official document showing your address.
                  </p>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      setFiles((c) => ({
                        ...c,
                        addressProof: e.target.files?.[0],
                      }))
                    }
                    className="mt-2 text-sm"
                  />
                  <FilePreview file={files.addressProof} label="Address document preview" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Step 4 — Submit verification</h3>
                  <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                    Reviews are typically completed within 1–2 business days.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-3 rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting…' : 'Submit for Review'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </Card>

      <SellerStatusHistoryPanel />
    </div>
  );
}
