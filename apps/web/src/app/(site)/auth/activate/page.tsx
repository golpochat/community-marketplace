'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Button, Label, PasswordInput } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
import { navigateAfterAuth } from '@/lib/navigate-after-auth';
import { consumeRegistrationIntent } from '@/lib/registration-intent';
import { WEB_APP_ROUTES, getWebDashboardPathForRole } from '@/lib/rbac-routes';
import { authService } from '@/services/auth.service';

export default function ActivateEmailPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md py-16 text-center text-muted-foreground">Loading activation…</p>}>
      <ActivateEmailContent />
    </Suspense>
  );
}

function ActivateEmailContent() {
  const searchParams = useSearchParams();
  const { setAuth } = useAuth();
  const token = searchParams.get('token');

  const [preview, setPreview] = useState<{
    email: string;
    alreadyActivated: boolean;
  } | null>(null);
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
      setError('This activation link is missing a token. Please use the link from your email.');
      setLoading(false);
      return;
    }

    authService
      .previewActivation(token)
      .then((response) =>
        setPreview({
          email: response.email,
          alreadyActivated: response.alreadyActivated,
        }),
      )
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
      const response = await authService.activateAccount(token, password, confirmPassword);
      if (response.login) {
        setAuth(response.login);
        const intent = consumeRegistrationIntent();
        navigateAfterAuth(
          intent === 'seller'
            ? WEB_APP_ROUTES.accountStartSelling
            : (response.login.redirectPath ?? getWebDashboardPathForRole(response.login.user.role)),
        );
        return;
      }

      setPreview((current) =>
        current
          ? { ...current, alreadyActivated: true }
          : { email: response.email, alreadyActivated: true },
      );
      setSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation failed');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-muted-foreground">Loading activation…</p>
      </div>
    );
  }

  if (error && !preview) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-destructive">{error}</p>
        <Button className="mt-6" asChild>
          <Link href="/auth/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  if (preview?.alreadyActivated) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-muted-foreground">
          Your account for <span className="font-medium text-foreground">{preview.email}</span> is
          already active. You can sign in.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/auth/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="text-2xl font-bold text-foreground">Set your password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Almost done — create a password for your SellNearby account ({preview?.email}).
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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
          <Label htmlFor="confirm-password">Confirm password</Label>
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
          {submitting ? 'Activating…' : 'Activate account'}
        </Button>
      </form>
    </div>
  );
}
