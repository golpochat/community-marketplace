'use client';

import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

import type {
  FastTrackIntentResponse,
  FastTrackStatusResponse,
  SellerVerificationStatus,
} from '@community-marketplace/types';
import { SELLER_VERIFICATION_MESSAGES, VERIFICATION_ONBOARDING_COPY, computeFastTrackReviewDueAt, formatFastTrackSlaLabel } from '@community-marketplace/types';
import { formatDateTime } from '@community-marketplace/utils';
import { IRISH_MOBILE_VALIDATION_MESSAGE, normalizeIrishPhoneToE164 } from '@community-marketplace/validation';
import { Button, Input, Label, useAppFeedback } from '@community-marketplace/ui';
import { Card } from '@community-marketplace/ui-dashboard';

import { IrishMobilePrefixTooltip } from '@/components/forms/irish-mobile-prefix-tooltip';
import { VerificationProgressBar } from '@/components/seller/verification';
import { BoostCheckoutPanel } from '@/components/payments/boost-checkout-panel';
import { monetizationService } from '@/services/monetization.service';
import { sellerVerificationService } from '@/services/seller-verification.service';
import { SellerProfileStatusBadge } from '@/components/seller/profile/seller-profile-status-badge';

import { SellerStatusHistoryPanel } from './seller-status-history-panel';

const STEPS = [
  { id: 1, label: 'Details' },
  { id: 2, label: 'Phone' },
  { id: 3, label: 'ID' },
  { id: 4, label: 'Address' },
  { id: 5, label: 'Submit' },
] as const;

/** Furthest incomplete step index (0–4). */
function incompleteStepIndex(status: SellerVerificationStatus | null): number {
  if (!status) return 0;
  if (status.sellerStatus === 'verified' || status.verificationRequestedAt) return 4;
  if (!status.personalDetailsComplete) return 0;
  if (!status.phoneVerified) return 1;
  if (!status.idVerified && (!status.pendingRequest?.idDocumentPath || !status.pendingRequest?.selfiePath)) {
    return 2;
  }
  return 4;
}

/** Highest step index the user may open (inclusive). */
function maxUnlockedStep(
  status: SellerVerificationStatus | null,
  files: { idDocument?: File; selfie?: File },
): number {
  if (!status) return 0;
  if (status.sellerStatus === 'verified' || status.verificationRequestedAt) return 4;
  if (!status.personalDetailsComplete) return 0;
  if (!status.phoneVerified) return 1;

  const hasId =
    Boolean(status.pendingRequest?.idDocumentPath) || Boolean(files.idDocument);
  const hasSelfie =
    Boolean(status.pendingRequest?.selfiePath) || Boolean(files.selfie);
  if (!hasId || !hasSelfie) return 2;

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
        <img src={preview} alt="" className="max-h-28 rounded-lg border object-contain" />
      ) : (
        <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-[hsl(var(--dashboard-sidebar-border))] text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          No file selected
        </div>
      )}
    </div>
  );
}

function StatusSummary({ status }: { status: SellerVerificationStatus }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
      <span className="inline-flex items-center gap-1.5">
        Account <SellerProfileStatusBadge status={status.sellerStatus} />
      </span>
      <span aria-hidden>·</span>
      <span>{status.emailVerified ? 'Email verified' : 'Email required'}</span>
      <span aria-hidden>·</span>
      <span>{status.phoneVerified ? 'Phone verified' : 'Phone required'}</span>
    </div>
  );
}

function PriorityRequeueBanner() {
  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/90 px-3 py-3">
      <p className="text-sm font-medium text-indigo-950">Complimentary priority re-queue</p>
      <p className="mt-0.5 text-xs text-indigo-900">
        {SELLER_VERIFICATION_MESSAGES.FAST_TRACK_REQUEUE_GRANTED}
      </p>
    </div>
  );
}

function PriorityReviewStatus({
  reviewDueAt,
}: {
  reviewDueAt?: string;
}) {
  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/90 px-3 py-3">
      <p className="text-sm font-medium text-indigo-950">Priority review active</p>
      <p className="mt-0.5 text-xs text-indigo-900">
        Your case is in the fast-track queue. We aim to decide within 24 hours of submission.
        {reviewDueAt ? (
          <>
            {' '}
            Target: {formatDateTime(reviewDueAt)} ({formatFastTrackSlaLabel(reviewDueAt)}).
          </>
        ) : null}
      </p>
    </div>
  );
}

function FastTrackBanner({
  status,
  fastTrack,
  onUpdated,
}: {
  status: SellerVerificationStatus;
  fastTrack: FastTrackStatusResponse;
  onUpdated: () => void;
}) {
  const feedback = useAppFeedback();
  const [intent, setIntent] = useState<FastTrackIntentResponse | null>(null);
  const [loading, setLoading] = useState(false);
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
    try {
      const response = await monetizationService.createFastTrackIntent();
      setIntent(response);
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/80 px-3 py-3">
      {fastTrack.hasPriority || success ? (
        <p className="text-sm text-indigo-900">
          Payment confirmed — priority review is active for this case.
        </p>
      ) : (
        <>
          <p className="text-sm text-indigo-900">
            Optional fast-track for{' '}
            <span className="font-semibold">€{fastTrack.price.toFixed(2)}</span> (24-hour queue).
          </p>
          {intent ? (
            <div className="mt-3">
              <BoostCheckoutPanel
                intent={intent}
                confirmPurchase={monetizationService.confirmFastTrack}
                confirmLabel="Pay and fast-track"
                onSuccess={() => {
                  setSuccess(true);
                  setIntent(null);
                  feedback.success('Fast-track activated');
                  onUpdated();
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => void startCheckout()}
              className="mt-2 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-sm font-medium text-indigo-900 hover:bg-indigo-100 disabled:opacity-50"
            >
              {loading ? 'Starting…' : 'Fast-track verification'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

interface SellerVerificationFlowProps {
  onSubmitted?: () => void;
}

export function SellerVerificationFlow({ onSubmitted }: SellerVerificationFlowProps) {
  const feedback = useAppFeedback();
  const [status, setStatus] = useState<SellerVerificationStatus | null>(null);
  const [fastTrack, setFastTrack] = useState<FastTrackStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStep, setSelectedStep] = useState(0);
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

  function hydrateFormFromStatus(verificationStatus: SellerVerificationStatus) {
    if (verificationStatus.legalName) {
      setFullName(verificationStatus.legalName);
    }
    if (verificationStatus.registeredCompanyName) {
      setRegisteredCompanyName(verificationStatus.registeredCompanyName);
    }
    if (verificationStatus.croNumber) {
      setCroNumber(verificationStatus.croNumber);
    }
    if (verificationStatus.phone) {
      setPhone(verificationStatus.phone);
      setNormalizedPhone(verificationStatus.phone);
    }
  }

  async function load(options?: { syncStep?: boolean }) {
    setLoading(true);
    try {
      const [verificationStatus, fastTrackStatus] = await Promise.all([
        sellerVerificationService.getStatus(),
        monetizationService.getFastTrackStatus().catch(() => null),
      ]);
      setStatus(verificationStatus);
      setFastTrack(fastTrackStatus);
      hydrateFormFromStatus(verificationStatus);
      if (options?.syncStep !== false) {
        setSelectedStep(incompleteStepIndex(verificationStatus));
      }
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : 'Failed to load verification');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const unlocked = maxUnlockedStep(status, files);
  const step = Math.min(selectedStep, unlocked);

  function goToStep(index: number) {
    if (index < 0 || index > unlocked) return;
    setSelectedStep(index);
  }

  async function handleSavePersonalDetails() {
    if (!fullName.trim()) {
      feedback.error('Enter your full legal name as it appears on your ID.');
      return false;
    }
    if (status?.businessStructure === 'limited_company') {
      if (!registeredCompanyName.trim()) {
        feedback.error('Enter your registered company name.');
        return false;
      }
      if (!croNumber.trim()) {
        feedback.error('Enter your CRO number.');
        return false;
      }
    }

    const unchanged =
      status?.personalDetailsComplete &&
      status.legalName?.trim() === fullName.trim() &&
      (status.businessStructure !== 'limited_company' ||
        (status.registeredCompanyName?.trim() === registeredCompanyName.trim() &&
          status.croNumber?.trim() === croNumber.trim()));

    if (unchanged) {
      setSelectedStep(1);
      return true;
    }

    setSubmitting(true);
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
      feedback.success('Legal details saved');
      await load({ syncStep: false });
      setSelectedStep(1);
      return true;
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : 'Failed to save personal details');
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendOtp() {
    if (!phone.trim()) {
      feedback.error('Enter your phone number.');
      return;
    }
    const e164 = normalizeIrishPhoneToE164(phone);
    if (!e164) {
      feedback.error(IRISH_MOBILE_VALIDATION_MESSAGE);
      return;
    }
    setSubmitting(true);
    try {
      await sellerVerificationService.phone({
        action: 'send_otp',
        phone: e164,
      });
      setNormalizedPhone(e164);
      setOtpSent(true);
      feedback.success('Code sent');
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp() {
    const e164 = normalizedPhone || normalizeIrishPhoneToE164(phone);
    if (!e164) {
      feedback.error(IRISH_MOBILE_VALIDATION_MESSAGE);
      return false;
    }
    if (!otpCode.trim()) {
      feedback.error('Enter the code we sent you.');
      return false;
    }
    setSubmitting(true);
    try {
      await sellerVerificationService.phone({
        action: 'verify_otp',
        phone: e164,
        code: otpCode.trim(),
      });
      feedback.success('Phone verified');
      await load({ syncStep: false });
      setSelectedStep(2);
      return true;
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : 'Invalid OTP');
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  function handleContinueFromId() {
    const hasId =
      Boolean(status?.pendingRequest?.idDocumentPath) || Boolean(files.idDocument);
    const hasSelfie =
      Boolean(status?.pendingRequest?.selfiePath) || Boolean(files.selfie);
    if (!hasId || !hasSelfie) {
      feedback.error('ID document and selfie are required.');
      return false;
    }
    setSelectedStep(3);
    return true;
  }

  async function handleSubmitDocuments() {
    const idFile = files.idDocument;
    const selfieFile = files.selfie;
    const hasRemoteId = Boolean(status?.pendingRequest?.idDocumentPath);
    const hasRemoteSelfie = Boolean(status?.pendingRequest?.selfiePath);

    if ((!idFile && !hasRemoteId) || (!selfieFile && !hasRemoteSelfie)) {
      feedback.error('ID document and selfie are required.');
      return false;
    }

    setSubmitting(true);
    try {
      // Ensure a single draft exists before parallel path stores (avoids create races).
      await sellerVerificationService.start();

      const [idDocumentPath, selfiePath, addressDocumentPath] = await Promise.all([
        idFile
          ? sellerVerificationService.uploadDocument(idFile, 'id')
          : Promise.resolve(status!.pendingRequest!.idDocumentPath!),
        selfieFile
          ? sellerVerificationService.uploadDocument(selfieFile, 'selfie')
          : Promise.resolve(status!.pendingRequest!.selfiePath!),
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
      feedback.success('Submitted for review');
      await load({ syncStep: true });
      onSubmitted?.();
      return true;
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : 'Failed to submit verification');
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePrimaryAction() {
    if (!status) return;
    if (step === 0) {
      await handleSavePersonalDetails();
      return;
    }
    if (step === 1) {
      if (status.phoneVerified) {
        setSelectedStep(2);
        return;
      }
      if (!otpSent) {
        await handleSendOtp();
        return;
      }
      await handleVerifyOtp();
      return;
    }
    if (step === 2) {
      handleContinueFromId();
      return;
    }
    if (step === 3) {
      setSelectedStep(4);
      return;
    }
    await handleSubmitDocuments();
  }

  const primaryLabel = (() => {
    if (submitting) {
      if (step === 4) return 'Submitting…';
      if (step === 1 && !otpSent) return 'Sending…';
      if (step === 1) return 'Verifying…';
      return 'Saving…';
    }
    if (step === 0) return 'Save and continue';
    if (step === 1 && status?.phoneVerified) return 'Continue';
    if (step === 1 && !otpSent) return 'Send code';
    if (step === 1) return 'Verify and continue';
    if (step === 2) return 'Continue';
    if (step === 3) return 'Continue';
    return 'Submit for review';
  })();

  if (loading && !status) {
    return <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading verification…</p>;
  }

  if (!status) {
    return (
      <p className="text-sm text-destructive">Unable to load verification status.</p>
    );
  }

  const flowLocked =
    status.sellerStatus === 'verified' || status.sellerStatus === 'under_review';

  const hasPriorityReview =
    Boolean(status.pendingRequest?.priority) || Boolean(fastTrack?.hasPriority);
  const priorityReviewDueAt =
    fastTrack?.priorityReviewDueAt ??
    (hasPriorityReview && status.verificationRequestedAt
      ? computeFastTrackReviewDueAt(status.verificationRequestedAt)
      : undefined);

  return (
    <div className="space-y-4">
      {status.sellerStatus !== 'verified' && (
        <VerificationProgressBar
          used={status.unverifiedListingCount}
          limit={status.sellerLimit}
          className="max-w-md"
        />
      )}

      {status.sellerStatus === 'under_review' && hasPriorityReview ? (
        <PriorityReviewStatus reviewDueAt={priorityReviewDueAt} />
      ) : null}

      {status.sellerStatus === 'unverified' &&
      status.verificationRejectedReason &&
      fastTrack?.hasPriorityRequeue ? (
        <PriorityRequeueBanner />
      ) : null}

      <Card title="Verification">
        <div className="space-y-4">
          <StatusSummary status={status} />

          {status.legalName && step > 0 ? (
            <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Legal name on file:{' '}
              <span className="font-medium text-[hsl(var(--dashboard-main-fg))]">
                {status.legalName}
              </span>
              {status.businessStructure === 'limited_company' && status.registeredCompanyName ? (
                <>
                  {' '}
                  · Company:{' '}
                  <span className="font-medium text-[hsl(var(--dashboard-main-fg))]">
                    {status.registeredCompanyName}
                  </span>
                </>
              ) : null}
              {' '}
              <button
                type="button"
                className="font-medium text-[hsl(var(--dashboard-accent))] underline-offset-2 hover:underline"
                onClick={() => goToStep(0)}
              >
                Edit
              </button>
            </p>
          ) : null}

          <ol className="flex flex-wrap gap-1.5" aria-label="Verification steps">
            {STEPS.map((item, index) => {
              const enabled = index <= unlocked;
              const isActive = index === step;
              const isDone = index < incompleteStepIndex(status);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={!enabled || flowLocked}
                    onClick={() => goToStep(index)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[hsl(var(--dashboard-accent))] text-white'
                        : isDone
                          ? 'bg-[hsl(var(--dashboard-accent)/0.15)] text-[hsl(var(--dashboard-accent))]'
                          : 'bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-[hsl(var(--dashboard-sidebar-muted))]'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {item.id}. {item.label}
                  </button>
                </li>
              );
            })}
          </ol>

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
            <p className="text-sm text-destructive">{status.verificationRejectedReason}</p>
          )}

          {!flowLocked && (
            <div className="min-h-[12rem] space-y-4 border-t border-[hsl(var(--dashboard-sidebar-border))] pt-4">
              {step === 0 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-[hsl(var(--dashboard-main-fg))]">
                      Legal identity
                    </h3>
                    <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                      {VERIFICATION_ONBOARDING_COPY.PERSONAL_DETAILS_PRIVATE}
                    </p>
                  </div>

                  {(status.publicDisplayName || status.businessName) && (
                    <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                      Public name: {status.businessName ?? status.publicDisplayName}
                      {status.isBusinessAccount ? ' (business)' : ''}
                    </p>
                  )}

                  <div className="rounded-xl border border-[hsl(var(--dashboard-accent)/0.3)] bg-[hsl(var(--dashboard-accent)/0.05)] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[hsl(var(--dashboard-accent))]" aria-hidden />
                      <p className="text-sm font-medium">Full legal name</p>
                    </div>
                    <Input
                      id="seller-verify-full-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Exactly as shown on your government ID"
                      autoComplete="name"
                      className="w-full bg-white"
                    />
                    {status.businessStructure === 'limited_company' && (
                      <div className="mt-4 space-y-3 border-t border-[hsl(var(--dashboard-accent)/0.2)] pt-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="seller-verify-company">Registered company name</Label>
                          <Input
                            id="seller-verify-company"
                            type="text"
                            value={registeredCompanyName}
                            onChange={(e) => setRegisteredCompanyName(e.target.value)}
                            placeholder="As registered with the CRO"
                            className="w-full bg-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="seller-verify-cro">CRO number</Label>
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
                </div>
              )}

              {step === 1 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">Phone verification</h3>
                    <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                      Enter your mobile number and the one-time code we send.
                    </p>
                  </div>
                  {status.phoneVerified ? (
                    <p className="text-sm text-emerald-700">Phone verified.</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="seller-verify-phone">Mobile number</Label>
                        <IrishMobilePrefixTooltip />
                      </div>
                      <Input
                        id="seller-verify-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="087 123 4567"
                        className="max-w-sm"
                      />
                      {otpSent && (
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter OTP"
                          className="max-w-xs"
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">ID upload</h3>
                    <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                      Government ID and a selfie holding the same ID.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="mb-2 block">Government ID</Label>
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
                      {status.pendingRequest?.idDocumentPath && !files.idDocument ? (
                        <p className="mt-1 text-xs text-emerald-700">Already uploaded</p>
                      ) : null}
                    </div>
                    <div>
                      <Label className="mb-2 block">Selfie with ID</Label>
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
                      {status.pendingRequest?.selfiePath && !files.selfie ? (
                        <p className="mt-1 text-xs text-emerald-700">Already uploaded</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">Address proof (optional)</h3>
                    <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                      Utility bill or official document. You can skip this step.
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      setFiles((c) => ({
                        ...c,
                        addressProof: e.target.files?.[0],
                      }))
                    }
                    className="text-sm"
                  />
                  <FilePreview file={files.addressProof} label="Address document preview" />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">Submit for review</h3>
                    <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                      Reviews are typically completed within 1–2 business days.
                    </p>
                  </div>
                  {fastTrack ? (
                    <FastTrackBanner
                      status={status}
                      fastTrack={fastTrack}
                      onUpdated={() => void load({ syncStep: false })}
                    />
                  ) : null}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[hsl(var(--dashboard-sidebar-border))] pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={step === 0 || submitting}
                  onClick={() => goToStep(step - 1)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handlePrimaryAction()}
                >
                  {primaryLabel}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <SellerStatusHistoryPanel />
    </div>
  );
}
