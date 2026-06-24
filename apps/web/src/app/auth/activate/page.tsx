'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import type { EmailActivationResponse } from '@community-marketplace/types';
import { Button } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';

const ADMIN_APP_URL = process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? 'http://localhost:3001';

export default function ActivateEmailPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md py-16 text-center text-gray-700">Activating your account...</p>}>
      <ActivateEmailContent />
    </Suspense>
  );
}

function ActivateEmailContent() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [message, setMessage] = useState('Activating your account...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Missing activation token.');
      return;
    }

    apiClient<EmailActivationResponse>(WEB_API_ROUTES.public.auth.activate, {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then((response) => {
        const { data } = response;
        if (data.login) {
          if (data.login.appTarget === 'admin') {
            const target = `${ADMIN_APP_URL}${data.login.redirectPath}`;
            window.location.href = `${target}?accessToken=${encodeURIComponent(data.login.accessToken)}`;
            return;
          }
          setAuth(data.login);
          router.push(data.login.redirectPath);
          return;
        }

        setMessage(
          data.activated
            ? `Email ${data.email} activated. You can sign in now.`
            : `Email ${data.email} was already activated.`,
        );
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, [token, router, setAuth]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      {error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <p className="text-gray-700">{message}</p>
      )}
      <Button className="mt-6" onClick={() => router.push('/auth/login')}>
        Go to sign in
      </Button>
    </div>
  );
}