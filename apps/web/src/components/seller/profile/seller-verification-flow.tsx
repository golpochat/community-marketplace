'use client';

import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

import type {
  FastTrackIntentResponse,
  FastTrackStatusResponse,
  SellerVerificationStatus,
} from '@community-marketplace/types';
import { SELLER_VERIFICATION_MESSAGES, VERIFICATION_ONBOARDING_COPY } from '@community-marketplace/types';
import { IRISH_MOBILE_VALIDATION_MESSAGE, normalizeIrishPhoneToE164 } from '@community-marketplace/validation';
import { Input, Label } from '@community-marketplace/ui';
import { Card } from '@community-marketplace/ui-dashboard';

import { IrishMobilePrefixTooltip } from '@/components/forms/irish-mobile-prefix-tooltip';

import { VerificationProgressBar, VerificationChecklist } from '@/components/seller/verification';
import { BoostCheckoutPanel } from '@/components/payments/boost-checkout-panel';
import { monetizationService } from '@/services/monetization.service';
import { sellerVerificationService } from '@/services/seller-verification.service';

import { SellerStatusHistoryPanel } from './seller-status-history-panel';

const STEPS = [
  { id: 1, label: 'Personal details' },
  { id: 2, label: 'Phone' },
  { id: 3, label: 'ID upload' },
  { id: 4, label: 'Address (optional)' },
  { id: 5, label: 'Submit' },
] as const;

function activeStepIndex(status: SellerVerificationStatus | null): number {
  if (!status) return 0;
  if (status.sellerStatus === 'verified' || status.verificationRequestedAt) return 4;
  if (!status.personalDetailsComplete) return 0;
  if (!status.phoneVerified || !status.emailVerified) return 1;
  if (!status.idVerified && !status.pendingRequest?.idDocumentPath) return 2;
  if (!status.pendingRequest?.selfiePath) return 3;
  return 4;
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
      <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">{label}</p>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="max-h-40 rounded-lg border object-contain" />
      ) : (
        <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-[hsl(var(--dashboard-sidebar-border))] text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          No file selected
        </div>
      )}
    </div>
  );
}

function FastTrackCard({
  status,
  fastTrack,
  onUpdated,
}: {
  status: SellerVerificationStatus;
  fastTrack: FastTrackStatusResponse;
  onUpdated: () => void;
}) {
  const [intent, setIntent] = useState<FastTrackIntentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (
    status.sellerStatus === 'verified' ||
    !fastTrack.enabled ||
    (!fastTrack.eligible && !fastTrack.hasPriority)
  ) {
    return null;
  }

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await monetizationService.createFastTrackIntent();
      setIntent(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Fast-track verification">
      {fastTrack.hasPriority || success ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-indigo-800">Priority review</p>
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            You&apos;re in the priority queue. We aim to review within 24 hours. Fast-track uses
            your verified phone, email, or other identity signals to accelerate review — it does not
            skip verification.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            {VERIFICATION_ONBOARDING_COPY.FAST_TRACK_EXPLAINER} Optional fast-track for{' '}
            <span className="font-semibold text-[hsl(var(--dashboard-main-fg))]">
              €{fastTrack.price.toFixed(2)}
            </span>{' '}
            (24-hour priority queue). Standard review takes 3–5 business days.
          </p>
          {fastTrack.reason === 'personal_details_incomplete' && (
            <p className="mt-2 text-sm text-amber-700">
              Complete your personal details before purchasing fast-track.
            </p>
          )}
          {fastTrack.reason && (
            <p className="mt-2 text-sm text-amber-700">{fastTrack.reason}</p>
          )}
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          {intent ? (
            <div className="mt-4">
              <BoostCheckoutPanel
                intent={intent}
                confirmPurchase={monetizationService.confirmFastTrack}
                confirmLabel="Pay and fast-track"
                onSuccess={() => {
                  setSuccess(true);
                  setIntent(null);
                  onUpdated();
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => void startCheckout()}
              className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-100 disabled:opacity-50"
            >
              {loading ? 'Starting checkout…' : 'Fast-track verification'}
            </button>
          )}
        </>
      )}
    </Card>
  );
}

interface SellerVerificationFlowProps {
  onSubmitted?: () => void;
}

export function SellerVerificationFlow({ onSubmitted }: SellerVerificationFlowProps) {
  const [status, setStatus] = useState<SellerVerificationStatus | null>(null);
  const [fastTrack, setFastTrack] = useState<FastTrackStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [fullName, setFullName] = useState('');
  const [registeredCompanyName, setRegisteredCompanyName] = useState('');
  const [croNumber, setCroNumber] = useState('');
  const [files, setFiles] = useState<{
    idDocument?: File;
    selfie?: File;
    addressProof?: File;
  }>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [verificationStatus, fastTrackStatus] = await Promise.all([
        sellerVerificationService.getStatus(),
        monetizationService.getFastTrackStatus().catch(() => null),
      ]);
      setStatus(verificationStatus);
      setFastTrack(fastTrackStatus);
      if (!fullName.trim() && verificationStatus.personalDetailsComplete === false) {
        setFullName('');
      }
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
    status.personalDetailsComplete &&
    status.phoneVerified &&
    status.emailVerified;

  async function handleSavePersonalDetails(event: React.FormEvent) {
    event.preventDefault();
    if (!fullName.trim()) {
      setError('Enter your full legal name as it appears on your ID.');
      return;
    }
    if (status?.businessStructure === 'limited_company') {
      if (!registeredCompanyName.trim()) {
        setError('Enter your registered company name.');
        return;
      }
      if (!croNumber.trim()) {
        setError('Enter your CRO number.');
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      await sellerVerificationService.savePersonalDetails({
        legalName: fullName.trim(),
        ...(status?.businessStructure === 'limited_company'
          ? {
              registeredCompanyName: registeredCompanyName.trim(),
              croNumber: croNumber.trim(),
            }
          : {}),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save personal details');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendOtp() {
    if (!phone.trim()) {
      setError('Enter your phone number.');
      return;
    }
    const e164 = normalizeIrishPhoneToE164(phone);
    if (!e164) {
      setError(IRISH_MOBILE_VALIDATION_MESSAGE);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await sellerVerificationService.phone({
        action: 'send_otp',
        phone: e164,
      });
      setNormalizedPhone(e164);
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    const e164 = normalizedPhone || normalizeIrishPhoneToE164(phone);
    if (!e164) {
      setError(IRISH_MOBILE_VALIDATION_MESSAGE);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await sellerVerificationService.phone({
        action: 'verify_otp',
        phone: e164,
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

      const phoneE164 = normalizedPhone || normalizeIrishPhoneToE164(phone);
      await sellerVerificationService.submit({
        idDocumentPath,
        selfiePath,
        ...(addressDocumentPath ? { addressDocumentPath } : {}),
        ...(phoneE164 ? { phoneNumber: phoneE164 } : {}),
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
    return <p className="text-sm text-destructive">{error ?? 'Unable to load verification status.'}</p>;
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {status.sellerStatus !== 'verified' && (
        <VerificationProgressBar
          used={status.unverifiedListingCount}
          limit={status.sellerLimit}
        />
      )}

      {fastTrack && (
        <FastTrackCard status={status} fastTrack={fastTrack} onUpdated={() => void load()} />
      )}

      <Card title="Verification progress">
        <ol className="mb-6 flex flex-wrap gap-2">
          {STEPS.map((item, index) => (
            <li
              key={item.id}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                index <= step
                  ? 'bg-[hsl(var(--dashboard-accent))] text-white'
                  : 'bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-[hsl(var(--dashboard-sidebar-muted))]'
              }`}
            >
              {item.id}. {item.label}
            </li>
          ))}
        </ol>

        <VerificationChecklist status={status} />

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
          <p className="mb-4 text-sm text-destructive">{status.verificationRejectedReason}</p>
        )}

        {status.sellerStatus !== 'verified' && status.sellerStatus !== 'under_review' && (
          <>
            {!status.personalDetailsComplete && (
              <form
                onSubmit={(e) => void handleSavePersonalDetails(e)}
                className="space-y-5 border-t border-[hsl(var(--dashboard-sidebar-border))] pt-5"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-[hsl(var(--dashboard-main-fg))]">
                    Step 1 — Legal identity (private)
                  </h3>
                  <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                    {VERIFICATION_ONBOARDING_COPY.PERSONAL_DETAILS_REQUIRED}
                  </p>
                </div>

                {(status.publicDisplayName || status.businessName) && (
                  <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.2)] px-4 py-3 text-sm">
                    <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">Public name on your account</p>
                    <p className="mt-0.5 text-[hsl(var(--dashboard-sidebar-muted))]">
                      {status.businessName ?? status.publicDisplayName}
                      {status.isBusinessAccount ? ' (business)' : ''}
                    </p>
                    <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                      {VERIFICATION_ONBOARDING_COPY.PUBLIC_NAME_DIFFERS}
                    </p>
                  </div>
                )}

                <div className="rounded-xl border-2 border-[hsl(var(--dashboard-accent)/0.35)] bg-[hsl(var(--dashboard-accent)/0.06)] p-4 sm:p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--dashboard-accent)/0.12)] text-[hsl(var(--dashboard-accent))]">
                      <Lock className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[hsl(var(--dashboard-main-fg))]">
                        Your legal identity
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--dashboard-sidebar-muted))]">
                        {VERIFICATION_ONBOARDING_COPY.PERSONAL_DETAILS_PRIVATE}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seller-verify-full-name" className="text-[hsl(var(--dashboard-main-fg))]">
                      Full legal name
                    </Label>
                    <Input
                      id="seller-verify-full-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Exactly as shown on your government ID"
                      autoComplete="name"
                      className="w-full bg-white"
                    />
                    <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                      Must match the ID you upload in a later step.
                    </p>
                  </div>

                  {status.businessStructure === 'limited_company' && (
                    <div className="mt-5 space-y-4 border-t border-[hsl(var(--dashboard-accent)/0.2)] pt-5">
                      <div className="space-y-2">
                        <Label htmlFor="seller-verify-company" className="text-[hsl(var(--dashboard-main-fg))]">
                          Registered company name
                        </Label>
                        <Input
                          id="seller-verify-company"
                          type="text"
                          value={registeredCompanyName}
                          onChange={(e) => setRegisteredCompanyName(e.target.value)}
                          placeholder="As registered with the CRO"
                          className="w-full bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="seller-verify-cro" className="text-[hsl(var(--dashboard-main-fg))]">
                          CRO number
                        </Label>
                        <Input
                          id="seller-verify-cro"
                          type="text"
                          inputMode="numeric"
                          value={croNumber}
                          onChange={(e) => setCroNumber(e.target.value)}
                          placeholder="6–8 digits"
                          className="w-full bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  Save and continue
                </button>
              </form>
            )}

            {status.personalDetailsComplete &&
              (!status.phoneVerified || !status.emailVerified) &&
              (step === 1 || !status.phoneVerified) && (
              <div className="space-y-4 border-t border-[hsl(var(--dashboard-sidebar-border))] pt-4">
                <h3 className="text-sm font-semibold">Step 2 — Contact verification</h3>
                <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                  Enter your phone number and the one-time code we send you.
                </p>
                <div className="flex items-center gap-1.5">
                  <label htmlFor="seller-verify-phone" className="text-sm font-medium">
                    Mobile number
                  </label>
                  <IrishMobilePrefixTooltip />
                </div>
                <input
                  id="seller-verify-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="087 123 4567"
                  className="w-full max-w-sm rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
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
                      className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
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
                className="space-y-6 border-t border-[hsl(var(--dashboard-sidebar-border))] pt-4"
              >
                <div>
                  <h3 className="text-sm font-semibold">Step 3 — ID upload</h3>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-[hsl(var(--dashboard-main-fg))]">Government ID</label>
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
                      <label className="mb-2 block text-sm text-[hsl(var(--dashboard-main-fg))]">Selfie with ID</label>
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
