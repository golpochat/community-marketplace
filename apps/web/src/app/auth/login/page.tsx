import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

import { LoginForm } from '@/components/auth/login-form';

export const metadata = { title: 'Sign In' };

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
      <p className="mt-2 text-sm text-gray-600">Welcome back to Community Marketplace</p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-gray-600">
        No account?{' '}
        <Link href="/auth/register" className="font-medium text-primary hover:text-primary/90">
          Create one
        </Link>
      </p>
      <div className="mt-4 text-center">
        <Link href="/">
          <Button variant="ghost">Back to home</Button>
        </Link>
      </div>
    </div>
  );
}
