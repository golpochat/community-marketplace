import Link from 'next/link';
import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/login-form';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">Welcome back to SellNearby</p>
      <Suspense fallback={<p className="mt-6 text-sm text-muted-foreground">Loading…</p>}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link href="/auth/register" className="font-medium text-primary hover:text-primary/90">
          Create one
        </Link>
      </p>
    </div>
  );
}
