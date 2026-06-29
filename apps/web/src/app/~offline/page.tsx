import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

import { OfflineRetryButton } from '@/components/pwa/offline-retry-button';

export const metadata = {
  title: 'Offline',
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">You&apos;re offline</h1>
      <p className="mt-3 text-sm text-gray-600">
        SellNearby needs an internet connection to load listings and messages. Check your
        connection, then try again.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <OfflineRetryButton />
        <Link href="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    </main>
  );
}
