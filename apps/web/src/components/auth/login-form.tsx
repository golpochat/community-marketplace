'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';

const ADMIN_APP_URL = process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? 'http://localhost:3001';

export function LoginForm() {
  const router = useRouter();
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

      if (response.appTarget === 'admin') {
        const target = `${ADMIN_APP_URL}${response.redirectPath}`;
        window.location.href = `${target}?accessToken=${encodeURIComponent(response.accessToken)}&refreshToken=${encodeURIComponent(response.refreshToken)}`;
        return;
      }

      setAuth(response);
      router.push(response.redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
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
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
