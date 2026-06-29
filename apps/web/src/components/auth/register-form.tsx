'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import type { RegistrationAccountType } from '@community-marketplace/types';
import { Button, PasswordInput } from '@community-marketplace/ui';

import { authService } from '@/services/auth.service';
import { formatIrishPhoneHint, normalizeIrishPhoneToE164 } from '@/lib/phone';

type Step = 'phone' | 'otp' | 'details' | 'done';

const ACCOUNT_OPTIONS: Array<{
  value: RegistrationAccountType;
  label: string;
  description: string;
}> = [
  {
    value: 'buyer',
    label: 'I want to buy locally',
    description: 'Browse listings, message sellers, and purchase items near you.',
  },
  {
    value: 'seller',
    label: 'I want to sell on SellNearby',
    description: 'Create listings and receive payments. Verification required before selling.',
  },
];

export function RegisterForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('phone');
  const [accountType, setAccountType] = useState<RegistrationAccountType | ''>('');
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneVerificationToken, setPhoneVerificationToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('intent') === 'seller') {
      setAccountType('seller');
    }
  }, [searchParams]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!accountType) {
      setError('Choose whether you are signing up as a buyer or a seller.');
      return;
    }

    const e164 = normalizeIrishPhoneToE164(phone);
    if (!e164) {
      setError('Enter a valid Irish mobile number (e.g. 087 100 0002 or +353 87 100 0002).');
      return;
    }

    setLoading(true);
    try {
      await authService.sendOtp(e164);
      setNormalizedPhone(e164);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
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
      setStep('details');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteRegistration(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!accountType) {
      setError('Choose whether you are signing up as a buyer or a seller.');
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
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'phone') {
    return (
      <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-700">Account type</legend>
          {ACCOUNT_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 px-3 py-3 hover:bg-gray-50 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/40"
            >
              <input
                type="radio"
                name="account-type"
                value={option.value}
                checked={accountType === option.value}
                onChange={() => setAccountType(option.value)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                <span className="block text-xs text-gray-500">{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Irish mobile number
          </label>
          <input
            id="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="087 100 0002 or +353 87 100 0002"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Use a valid Irish number with or without the +353 country code.
          </p>
        </div>

        <Button type="submit" disabled={loading || !accountType} className="w-full">
          {loading ? 'Sending code...' : 'Send verification code'}
        </Button>
      </form>
    );
  }

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <p className="text-sm text-gray-600">
          Enter the 6-digit code sent to{' '}
          {normalizedPhone ? formatIrishPhoneHint(normalizedPhone) : phone}
        </p>
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Verification code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Verifying...' : 'Verify code'}
        </Button>
      </form>
    );
  }

  if (step === 'details') {
    return (
      <form onSubmit={handleCompleteRegistration} className="mt-6 space-y-4">
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <p className="text-sm text-gray-600">
          Last step — enter your details to create your{' '}
          {accountType === 'seller' ? 'seller' : 'buyer'} account.
        </p>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            {accountType === 'seller' ? 'Store name or your name' : 'Full name'}
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <PasswordInput
            id="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 h-10 rounded-lg border-gray-300 text-sm focus:border-brand-500 focus:ring-brand-500"
          />
          <p className="mt-1 text-xs text-gray-500">Use at least 8 characters.</p>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Sending activation email...' : 'Create account'}
        </Button>
      </form>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {success && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p>}
      <p className="text-sm text-gray-600">
        We sent an activation link to <span className="font-medium text-gray-900">{email}</span>.
        Open the email and click the link — you&apos;ll be signed in automatically.
      </p>
      <p className="text-sm text-gray-600">
        The link expires in 24 hours. Didn&apos;t receive it? Check your spam folder.
      </p>
      <Link
        href="/auth/login"
        className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Go to sign in
      </Link>
    </div>
  );
}
