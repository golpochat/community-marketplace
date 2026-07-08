'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button, Label, PasswordInput } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';

interface ChangePasswordPanelProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function ChangePasswordPanel({ onSuccess, onError }: ChangePasswordPanelProps) {
  const { setAuth } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const newPasswordTooShort = newPassword.length > 0 && newPassword.length < 8;
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (newPassword.length < 8) {
      onError?.('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setAuth(result.login);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onSuccess?.(result.message);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
        Enter your current password, then choose a new one. Other signed-in devices will be
        signed out.
      </p>
      <div className="space-y-2">
        <Label htmlFor="current-password">Current password</Label>
        <PasswordInput
          id="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <PasswordInput
          id="new-password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          aria-invalid={newPasswordTooShort || undefined}
        />
        {newPasswordTooShort ? (
          <p className="text-sm text-destructive">Password must be at least 8 characters.</p>
        ) : (
          <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">Use at least 8 characters.</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-new-password">Confirm new password</Label>
        <PasswordInput
          id="confirm-new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          aria-invalid={passwordsMismatch || undefined}
        />
        {passwordsMismatch ? (
          <p className="text-sm text-destructive">Passwords do not match.</p>
        ) : null}
      </div>
      <Button
        type="submit"
        disabled={submitting || newPasswordTooShort || passwordsMismatch}
      >
        {submitting ? 'Updating password…' : 'Update password'}
      </Button>
      <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
        Forgot your current password?{' '}
        <Link
          href="/auth/forgot-password"
          className="font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
        >
          Request a reset link
        </Link>
      </p>
    </form>
  );
}
