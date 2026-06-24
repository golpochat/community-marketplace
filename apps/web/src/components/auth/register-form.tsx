'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@community-marketplace/ui';

import { authService } from '@/services/auth.service';

type Step = 'phone' | 'otp' | 'profile';

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneVerificationToken, setPhoneVerificationToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.sendOtp(phone);
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
      const result = await authService.verifyOtp(phone, code);
      setPhoneVerificationToken(result.phoneVerificationToken);
      setStep('profile');
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
    setLoading(true);
    try {
      const result = await authService.completeRegistration({
        name,
        email,
        phoneVerificationToken,
      });
      setSuccess(result.message);
      router.push('/auth/login');
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
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone number (E.164)
          </label>
          <input
            id="phone"
            type="tel"
            required
            placeholder="+14155552671"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Sending code...' : 'Send verification code'}
        </Button>
      </form>
    );
  }

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <p className="text-sm text-gray-600">Enter the 6-digit code sent to {phone}</p>
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

  return (
    <form onSubmit={handleCompleteRegistration} className="mt-6 space-y-4">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      {success && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p>}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Full name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Sending activation email...' : 'Create account'}
      </Button>
    </form>
  );
}
