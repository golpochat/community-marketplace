'use client';

import { useState } from 'react';

import { Button, Input, Label, useAppFeedback } from '@community-marketplace/ui';
import { IRISH_MOBILE_VALIDATION_MESSAGE } from '@community-marketplace/validation';

import { IrishMobileFieldLabel } from '@/components/forms/irish-mobile-field-label';
import { OtpPilotNotice } from '@/components/auth/otp-pilot-notice';
import { ContactVerifiedBadge } from '@/components/trust/contact-verified-badge';
import { isOtpPilotMode } from '@/lib/otp-pilot-mode';
import { formatIrishPhoneHint, normalizeIrishPhoneToE164 } from '@/lib/phone';
import { userService } from '@/services/user.service';

interface PhoneChangePanelProps {
  currentPhone: string;
  onPhoneUpdated: (phone: string) => void;
  onOpenVerification?: () => void;
  phoneVerified: boolean;
}

type Step = 'idle' | 'otp';

export function PhoneChangePanel({
  currentPhone,
  onPhoneUpdated,
  onOpenVerification,
  phoneVerified,
}: PhoneChangePanelProps) {
  const feedback = useAppFeedback();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [newPhone, setNewPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);

  function resetFlow() {
    setOpen(false);
    setStep('idle');
    setNewPhone('');
    setNormalizedPhone('');
    setCode('');
    setError(null);
    setDevOtpCode(null);
  }

  async function handleSendOtp() {
    setError(null);

    const e164 = normalizeIrishPhoneToE164(newPhone);
    if (!e164) {
      setError(IRISH_MOBILE_VALIDATION_MESSAGE);
      return;
    }

    setLoading(true);
    try {
      const result = await userService.sendPhoneChangeOtp(e164);
      setNormalizedPhone(e164);
      setDevOtpCode(result.devCode ?? null);
      setStep('otp');
      feedback.info('Verification code sent', result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError(null);
    setLoading(true);
    try {
      const updated = await userService.verifyPhoneChange(normalizedPhone, code);
      onPhoneUpdated(updated.phone ?? normalizedPhone);
      feedback.success('Phone number updated');
      resetFlow();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Label htmlFor="seller-phone">Phone</Label>
      <Input
        id="seller-phone"
        value={currentPhone}
        readOnly
        disabled
        className="bg-[hsl(var(--dashboard-sidebar-active)/0.35)] text-[hsl(var(--dashboard-sidebar-muted))]"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <ContactVerifiedBadge verified={phoneVerified} label="Phone" />
      </div>

      {!phoneVerified && onOpenVerification && (
        <button
          type="button"
          onClick={onOpenVerification}
          className="mt-2 text-xs font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
        >
          Verify phone
        </button>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setError(null);
          }}
          className="mt-2 text-xs font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
        >
          Change number
        </button>
      ) : (
        <div className="mt-3 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.35)] p-4">
          <p className="text-sm text-[hsl(var(--dashboard-main-fg))]">
            Enter your new Irish mobile number. We&apos;ll send a verification code to confirm it.
          </p>

          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

          {step === 'idle' ? (
            <div className="mt-3 space-y-3">
              <div>
                <IrishMobileFieldLabel htmlFor="seller-new-phone" className="flex items-center gap-1.5">
                  New mobile number
                </IrishMobileFieldLabel>
                <Input
                  id="seller-new-phone"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleSendOtp();
                    }
                  }}
                  placeholder="087 123 4567"
                  autoComplete="tel"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" disabled={loading} onClick={() => void handleSendOtp()}>
                  {loading ? 'Sending…' : 'Send verification code'}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={resetFlow}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <OtpPilotNotice
                devCode={devOtpCode}
                className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
              />
              <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                {isOtpPilotMode() && devOtpCode
                  ? `Enter the code shown above for ${formatIrishPhoneHint(normalizedPhone)}.`
                  : isOtpPilotMode()
                    ? `Enter the code for ${formatIrishPhoneHint(normalizedPhone)} (see notice above — not sent by SMS).`
                    : `Code sent to ${formatIrishPhoneHint(normalizedPhone)}`}
              </p>
              <div>
                <Label htmlFor="seller-phone-otp">Verification code</Label>
                <Input
                  id="seller-phone-otp"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && code.length === 6) {
                      e.preventDefault();
                      void handleVerifyOtp();
                    }
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-digit code"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={loading || code.length !== 6}
                  onClick={() => void handleVerifyOtp()}
                >
                  {loading ? 'Verifying…' : 'Verify and update'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setStep('idle');
                    setCode('');
                    setDevOtpCode(null);
                    setError(null);
                  }}
                >
                  Use a different number
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
