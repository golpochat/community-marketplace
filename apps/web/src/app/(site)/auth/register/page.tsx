import Link from 'next/link';
import { Suspense } from 'react';

import { RegisterForm } from '@/components/auth/register-form';

export const metadata = { title: 'Create Account' };

export default function RegisterPage() {
  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-foreground">Create account</h1>
      <p className="mt-2 text-sm text-muted-foreground">Join your local community marketplace</p>
      <Suspense fallback={<p className="mt-6 text-sm text-muted-foreground">Loading...</p>}>
        <RegisterForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-medium text-primary hover:text-primary/90">
          Sign in
        </Link>
      </p>
    </div>
  );
}
