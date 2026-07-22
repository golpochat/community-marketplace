'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, Input, Label, PasswordInput } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
import { navigateAfterAuth } from '@/lib/navigate-after-auth';
import { getWebDashboardPathForRole, WEB_APP_ROUTES } from '@/lib/rbac-routes';
import { authService } from '@/services/auth.service';

function safeReturnUrl(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export function LoginForm() {
  const { setAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = safeReturnUrl(searchParams.get('returnUrl'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'signing-in' | 'redirecting'>('idle');

  // Warm common post-login destinations so hard navigation is less cold in dev.
  useEffect(() => {
    router.prefetch(WEB_APP_ROUTES.account);
    router.prefetch('/super-admin/dashboard');
    router.prefetch('/admin/dashboard');
    if (returnUrl) router.prefetch(returnUrl);
  }, [router, returnUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setPhase('signing-in');

    try {
      const response = await authService.login({ email, password });
      const target =
        returnUrl ?? response.redirectPath ?? getWebDashboardPathForRole(response.user.role);

      setPhase('redirecting');
      // Cookies + persist first; auth pages keep guest chrome until hard navigation leaves.
      setAuth(response);
      router.prefetch(target);
      navigateAfterAuth(target);
      // Keep loading UI until the browser leaves this page.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
      setPhase('idle');
    }
  }

  const buttonLabel =
    phase === 'redirecting' ? 'Opening dashboard…' : phase === 'signing-in' ? 'Signing in…' : 'Sign in';

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
        {buttonLabel}
      </Button>
    </form>
  );
}
