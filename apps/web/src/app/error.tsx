'use client';

import Link from 'next/link';

import { t } from '@/i18n';

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold">{t('error.title')}</h1>
      <p className="text-sm text-muted-foreground">{t('error.body')}</p>
      <div className="flex gap-3">
        <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={reset}>
          {t('error.retry')}
        </button>
        <Link href="/" className="rounded-md border px-4 py-2 text-sm">
          {t('error.home')}
        </Link>
      </div>
    </main>
  );
}
