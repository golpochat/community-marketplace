'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, Label, PasswordInput } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';

export default function AdminInviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-md py-16 text-center text-[hsl(var(--dashboard-main-fg))]">Loading invitation…</p>
      }
    >
      <AdminInviteAcceptContent />
    </Suspense>
  );
}

function AdminInviteAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuth();
  const token = searchParams.get('token');

  const [preview, setPreview] = useState<{
    email: string;
    displayName: string;
    roleName: string;
    expired: boolean;
    alreadyAccepted: boolean;
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
      setError('This invitation link is missing a token. Please use the link from your email.');
      setLoading(false);
      return;
    }

    authService
      .previewAdminInvitation(token)
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
      const result = await authService.acceptAdminInvitation(token, password);
      setAuth(result.login);
      router.push(result.login.redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-center text-[hsl(var(--dashboard-main-fg))]">Loading invitation…</p>;
  }

  if (error && !preview) {
    return (
      <div className="text-center">
        <p className="text-destructive">{error}</p>
        <Button className="mt-6" asChild>
          <Link href="/auth/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  if (preview?.alreadyAccepted) {
    return (
      <div className="text-center">
        <p className="text-[hsl(var(--dashboard-main-fg))]">This invitation has already been accepted.</p>
        <Button className="mt-6" asChild>
          <Link href="/auth/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  if (preview?.expired) {
    return (
      <div className="text-center">
        <p className="text-destructive">This invitation has expired. Ask your super admin to send a new one.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[hsl(var(--dashboard-main-fg))]">Complete your setup</h1>
      <p className="mt-2 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
        {preview?.displayName ? `Hello ${preview.displayName}, ` : ''}
        you&apos;ve been invited as <strong>{preview?.roleName}</strong> ({preview?.email}).
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
            <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">Use at least 8 characters.</p>
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
          {submitting ? 'Setting up…' : 'Complete setup'}
        </Button>
      </form>
      <p className="mt-6 text-center text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-medium text-[hsl(var(--dashboard-accent))] hover:underline">
          Sign in
        </Link>
        {' or '}
        <Link
          href="/auth/forgot-password"
          className="font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
        >
          reset your password
        </Link>
        .
      </p>
    </div>
  );
}
