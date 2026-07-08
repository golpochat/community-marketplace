'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Button, Label, PasswordInput } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md py-16 text-center text-muted-foreground">Loading…</p>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuth();
  const token = searchParams.get('token');

  const [preview, setPreview] = useState<{ email: string; expired: boolean } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    if (!token) {
      setError('This reset link is missing a token. Please use the link from your email.');
      setLoading(false);
      return;
    }

    authService
      .previewPasswordReset(token)
      .then(setPreview)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await authService.resetPassword(token, password, confirmPassword);
      setAuth(response.login);
      router.push(response.login.redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-muted-foreground">Loading reset link…</p>
      </div>
    );
  }

  if (error && !preview) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-destructive">{error}</p>
        <Button className="mt-6" asChild>
          <Link href="/auth/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  if (preview?.expired) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-muted-foreground">
          This password reset link has expired. Request a new one to continue.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/auth/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="text-2xl font-bold text-foreground">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Set a new password for <span className="font-medium text-foreground">{preview?.email}</span>.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            autoComplete="new-password"
            aria-invalid={passwordTooShort || undefined}
            aria-describedby={passwordTooShort ? 'password-help' : undefined}
          />
          {passwordTooShort ? (
            <p id="password-help" className="text-sm text-destructive">
              Password must be at least 8 characters.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <PasswordInput
            id="confirm-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError(null);
            }}
            autoComplete="new-password"
            aria-invalid={passwordsMismatch || undefined}
            aria-describedby={passwordsMismatch ? 'confirm-password-error' : undefined}
          />
          {passwordsMismatch ? (
            <p id="confirm-password-error" className="text-sm text-destructive">
              Passwords do not match.
            </p>
          ) : null}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button
          type="submit"
          className="w-full"
          disabled={submitting || passwordTooShort || passwordsMismatch}
        >
          {submitting ? 'Updating password…' : 'Update password'}
        </Button>
      </form>
    </div>
  );
}
