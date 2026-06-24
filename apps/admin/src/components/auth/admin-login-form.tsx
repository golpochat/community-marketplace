'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@community-marketplace/ui';

import { useAdminAuth } from '@/hooks/use-admin-auth';
import { adminAuthService } from '@/services/auth.service';
import { useAdminAuthStore } from '@/store/admin-auth.store';

export function AdminLoginForm() {
  const router = useRouter();
  const { setAuth } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await adminAuthService.login({ email, password });

      if (response.appTarget !== 'admin') {
        setError('This account cannot access the admin console.');
        return;
      }

      setAuth(response);
      try {
        const me = await adminAuthService.fetchMe(response.accessToken);
        useAdminAuthStore.getState().setPermissions(me.permissions as import('@community-marketplace/types').PermissionCode[]);
      } catch {
        // Permissions will load on next navigation
      }
      router.push(response.redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
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
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
