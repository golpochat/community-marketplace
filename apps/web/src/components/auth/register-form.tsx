"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { VERIFICATION_ONBOARDING_COPY } from "@community-marketplace/types";
import { IRISH_MOBILE_VALIDATION_MESSAGE } from "@community-marketplace/validation";
import { Button, Input, Label } from "@community-marketplace/ui";

import { OtpPilotNotice } from "@/components/auth/otp-pilot-notice";
import { IrishMobileFieldLabel } from "@/components/forms/irish-mobile-field-label";
import { isOtpPilotMode } from "@/lib/otp-pilot-mode";
import {
  parseRegistrationIntent,
  persistRegistrationIntent,
} from "@/lib/registration-intent";
import { authService } from "@/services/auth.service";
import { formatIrishPhoneHint, normalizeIrishPhoneToE164 } from "@/lib/phone";

type Step = "phone" | "otp" | "details" | "done";

function FormError({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
      {message}
    </p>
  );
}

function FormSuccess({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm text-foreground">
      {message}
    </p>
  );
}

export function RegisterForm() {
  const searchParams = useSearchParams();
  const sellerIntent = parseRegistrationIntent(searchParams.get("intent")) === "seller";
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sellerIntent) {
      persistRegistrationIntent("seller");
    }
  }, [sellerIntent]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const e164 = normalizeIrishPhoneToE164(phone);
    if (!e164) {
      setError(IRISH_MOBILE_VALIDATION_MESSAGE);
      return;
    }

    setLoading(true);
    try {
      const result = await authService.sendOtp(e164);
      setNormalizedPhone(e164);
      setDevOtpCode(result.devCode ?? null);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authService.verifyOtp(normalizedPhone, code);
      setPhoneVerificationToken(result.phoneVerificationToken);
      setStep("details");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteRegistration(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    setLoading(true);
    try {
      const result = await authService.completeRegistration({
        name,
        email,
        phoneVerificationToken,
      });
      setSuccess(result.message);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  if (step === "phone") {
    return (
      <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
        {error && <FormError message={error} />}
        <p className="text-sm text-muted-foreground">
          {sellerIntent
            ? "Create one account to buy and sell locally. After activation you can continue straight to seller setup."
            : "One account to buy and sell locally. You can start selling anytime from your account."}
        </p>
        <div className="space-y-2">
          <IrishMobileFieldLabel htmlFor="phone" />
          <Input
            id="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="087 123 4567 or +353 87 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending code..." : "Send verification code"}
        </Button>
      </form>
    );
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
        <OtpPilotNotice devCode={devOtpCode} />
        {error && <FormError message={error} />}
        <p className="text-sm text-muted-foreground">
          {isOtpPilotMode() && devOtpCode
            ? "Enter the 6-digit code shown above for "
            : isOtpPilotMode()
              ? "Enter the 6-digit code for "
              : "Enter the 6-digit code sent to "}
          {normalizedPhone ? formatIrishPhoneHint(normalizedPhone) : phone}
          {isOtpPilotMode() && !devOtpCode ? " (see notice above — not sent by SMS)." : "."}
        </p>
        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Verifying..." : "Verify code"}
        </Button>
      </form>
    );
  }

  if (step === "details") {
    return (
      <form onSubmit={handleCompleteRegistration} className="mt-6 space-y-4">
        {error && <FormError message={error} />}
        <p className="text-sm text-muted-foreground">
          Last step — enter your details to create your SellNearby account.
        </p>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {VERIFICATION_ONBOARDING_COPY.REGISTRATION_EMAIL_PRIVATE}
          </p>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending activation email..." : "Create account"}
        </Button>
      </form>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {success && <FormSuccess message={success} />}
      <p className="text-sm text-muted-foreground">
        We sent an activation link to{" "}
        <span className="font-medium text-foreground">{email}</span>. Open the email and click the
        link to set your password and finish creating your account.
      </p>
      <p className="text-sm text-muted-foreground">
        The link expires in 24 hours. Didn&apos;t receive it? Check your spam folder.
      </p>
      <Button variant="outline" className="w-full" asChild>
        <Link href="/auth/login">Go to sign in</Link>
      </Button>
    </div>
  );
}
