"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { RegistrationAccountType } from "@community-marketplace/types";
import { IRISH_MOBILE_VALIDATION_MESSAGE } from "@community-marketplace/validation";
import {
  Button,
  Input,
  Label,
  PasswordInput,
  cn,
} from "@community-marketplace/ui";

import { IrishMobileFieldLabel } from "@/components/forms/irish-mobile-field-label";
import { InfoTooltip } from "@/components/forms/info-tooltip";
import { authService } from "@/services/auth.service";
import { formatIrishPhoneHint, normalizeIrishPhoneToE164 } from "@/lib/phone";

type Step = "phone" | "otp" | "details" | "done";

const ACCOUNT_OPTIONS: Array<{
  value: RegistrationAccountType;
  label: string;
  tooltip: string;
}> = [
  {
    value: "buyer",
    label: "I want to buy locally",
    tooltip: "Browse listings, message sellers, and purchase items near you.",
  },
  {
    value: "seller",
    label: "I want to sell on SellNearby",
    tooltip:
      "Create listings and message buyers. You can publish a limited number of listings before identity verification. Stripe payouts require seller verification.",
  },
];

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
  const [step, setStep] = useState<Step>("phone");
  const [accountType, setAccountType] = useState<RegistrationAccountType | "">(
    "",
  );
  const [phone, setPhone] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("intent") === "seller") {
      setAccountType("seller");
    }
  }, [searchParams]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!accountType) {
      setError("Choose whether you are signing up as a buyer or a seller.");
      return;
    }

    const e164 = normalizeIrishPhoneToE164(phone);
    if (!e164) {
      setError(IRISH_MOBILE_VALIDATION_MESSAGE);
      return;
    }

    setLoading(true);
    try {
      await authService.sendOtp(e164);
      setNormalizedPhone(e164);
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

    if (!accountType) {
      setError("Choose whether you are signing up as a buyer or a seller.");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.completeRegistration({
        accountType,
        name,
        email,
        password,
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

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">
            Account type
          </legend>
          {ACCOUNT_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-3 transition-colors duration-150",
                "hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5",
              )}
            >
              <input
                type="radio"
                name="account-type"
                value={option.value}
                checked={accountType === option.value}
                onChange={() => setAccountType(option.value)}
                className="mt-1 accent-primary"
              />
              <span className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">
                  {option.label}
                </span>
                <InfoTooltip ariaLabel={`About: ${option.label}`} wide>
                  {option.tooltip}
                </InfoTooltip>
              </span>
            </label>
          ))}
        </fieldset>

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

        <Button
          type="submit"
          disabled={loading || !accountType}
          className="w-full"
        >
          {loading ? "Sending code..." : "Send verification code"}
        </Button>
      </form>
    );
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
        {error && <FormError message={error} />}
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to{" "}
          {normalizedPhone ? formatIrishPhoneHint(normalizedPhone) : phone}
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
          Last step — enter your details to create your{" "}
          {accountType === "seller" ? "seller" : "buyer"} account.
        </p>

        <div className="space-y-2">
          <Label htmlFor="name">
            {accountType === "seller" ? "Store name or your name" : "Full name"}
          </Label>
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Use at least 8 characters.
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
        <span className="font-medium text-foreground">{email}</span>. Open the
        email and click the link — you&apos;ll be signed in automatically.
      </p>
      <p className="text-sm text-muted-foreground">
        The link expires in 24 hours. Didn&apos;t receive it? Check your spam
        folder.
      </p>
      <Button variant="outline" className="w-full" asChild>
        <Link href="/auth/login">Go to sign in</Link>
      </Button>
    </div>
  );
}
