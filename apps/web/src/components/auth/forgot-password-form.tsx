'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button, Input, Label } from '@community-marketplace/ui';

import { authService } from '@/services/auth.service';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const result = await authService.requestPasswordReset(email);
      setSuccess(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm text-foreground">
          {success}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Enter the email address for your account. If we find a match, we&apos;ll send a link to
        reset your password.
      </p>
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
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Sending link…' : 'Send reset link'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link href="/auth/login" className="font-medium text-primary hover:text-primary/90">
          Sign in
        </Link>
      </p>
    </form>
  );
}
