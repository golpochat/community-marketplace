'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';

export default function ActivateEmailPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md py-16 text-center text-muted-foreground">Activating your account...</p>}>
      <ActivateEmailContent />
    </Suspense>
  );
}

function ActivateEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuth();
  const [message, setMessage] = useState('Activating your account...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('This activation link is missing a token. Please use the link from your email.');
      return;
    }

    authService
      .activateAccount(token)
      .then((response) => {
        if (response.login) {
          setAuth(response.login);
          router.push(response.login.redirectPath);
          return;
        }

        setMessage(
          response.activated
            ? `Your account for ${response.email} is now active. You can sign in.`
            : `Your account for ${response.email} was already activated. You can sign in.`,
        );
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, [searchParams, router, setAuth]);

  if (error) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-destructive">{error}</p>
        <Button className="mt-6" asChild>
          <Link href="/auth/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
