import Link from 'next/link';

import { APP_NAME } from '@community-marketplace/config';
import { Button } from '@community-marketplace/ui';

import { LoginForm } from '@/components/auth/login-form';

export const metadata = { title: 'Sign In' };

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">Welcome back to {APP_NAME}</p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
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
