'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button, Input, Label, PasswordInput } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
import { navigateAfterAuth } from '@/lib/navigate-after-auth';
import { getWebDashboardPathForRole } from '@/lib/rbac-routes';
import { authService } from '@/services/auth.service';

export function LoginForm() {
  const { setAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      setAuth(response);
      navigateAfterAuth(response.redirectPath ?? getWebDashboardPathForRole(response.user.role));
      // Keep loading UI until the browser leaves this page.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
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
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
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
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-primary hover:text-primary/90"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Redirecting…' : 'Sign in'}
      </Button>
    </form>
  );
}
